"""Codex app-server session with explicit, one-request browser approvals."""

from __future__ import annotations

import json
import threading
import uuid

from .version_info import VERSION


class CodexSession:
    def __init__(self, job, process, instructions):
        self.job, self.process, self.instructions = job, process, instructions
        self.done = threading.Event()
        self.write_lock = threading.Lock()
        self.pending = {}

    def send(self, message):
        with self.write_lock:
            self.process.stdin.write(json.dumps(message) + "\n")
            self.process.stdin.flush()

    def start(self):
        self.send(
            {
                "id": 1,
                "method": "initialize",
                "params": {
                    "clientInfo": {"name": "ab_makeride", "version": VERSION},
                    "capabilities": {"experimentalApi": True},
                },
            }
        )

    def respond(self, identifier, decision, answers=None):
        with self.job.lock:
            request = self.pending.get(identifier)
            if not request or not self.job.active:
                raise ValueError("Solicitud de aprobación caducada o ya contestada.")
            method, params, request_id = request
            if method in ("item/tool/requestUserInput", "tool/requestUserInput"):
                expected = params.get("questions", [])
                if decision == "deny":
                    raise ValueError("Selecciona la opción de rechazo de cada pregunta.")
                if not isinstance(answers, dict) or set(answers) != {q["id"] for q in expected}:
                    raise ValueError("Responde a todas las preguntas de autorización.")
                for question in expected:
                    choices = [item["label"] for item in question.get("options") or []]
                    if answers[question["id"]] not in choices:
                        raise ValueError("Respuesta de autorización no válida.")
                result = {"answers": {key: {"answers": [value]} for key, value in answers.items()}}
            elif method == "mcpServer/elicitation/request":
                result = {
                    "action": "accept" if decision == "allow" else "decline",
                    "content": {} if decision == "allow" else None,
                }
            elif method in (
                "item/commandExecution/requestApproval",
                "item/fileChange/requestApproval",
            ):
                result = {"decision": "accept" if decision == "allow" else "decline"}
            else:
                # Unsupported permission expansion / elicitation never gets a grant.
                result = (
                    {"permissions": {}}
                    if method == "item/permissions/requestApproval"
                    else {"action": "decline", "content": None}
                )
            self.send({"id": request_id, "result": result})
            self.pending.pop(identifier)
            self.job.pending_approvals = [
                row for row in self.job.pending_approvals if row["id"] != identifier
            ]
            self.job.emit("Solicitud contestada manualmente por el usuario.", from_tool=False)

    def handle(self, event):
        if "error" in event and "id" in event:
            self.done.set()
            return [{"type": "turn.failed", "error": event["error"]}]
        if event.get("id") == 1 and "result" in event:
            self.send({"method": "initialized", "params": {}})
            self.send(
                {
                    "id": 2,
                    "method": "thread/start",
                    "params": {
                        "cwd": str(self.job.workspace),
                        "ephemeral": True,
                        "approvalPolicy": "on-request",
                        "sandbox": "danger-full-access"
                        if self.job.mode == "total"
                        else "workspace-write",
                    },
                }
            )
        elif event.get("id") == 2 and "result" in event:
            thread = event["result"]["thread"]["id"]
            self.send(
                {
                    "id": 3,
                    "method": "turn/start",
                    "params": {
                        "threadId": thread,
                        "input": [{"type": "text", "text": self.instructions}],
                    },
                }
            )
        method, params = event.get("method"), event.get("params") or {}
        if method and "id" in event:
            supported = (
                "item/tool/requestUserInput",
                "tool/requestUserInput",
                "item/commandExecution/requestApproval",
                "item/fileChange/requestApproval",
                "mcpServer/elicitation/request",
            )
            if method not in supported:
                self.send(
                    {
                        "id": event["id"],
                        "error": {
                            "code": -32601,
                            "message": "MakerIDE cannot authorize this request.",
                        },
                    }
                )
                self.job.error = (
                    "Solicitud de permisos no compatible; se ha rechazado sin ampliar acceso."
                )
                return []
            identifier = uuid.uuid4().hex
            if method == "mcpServer/elicitation/request" and (
                params.get("mode") != "form" or params.get("requestedSchema", {}).get("properties")
            ):
                self.send({"id": event["id"], "result": {"action": "decline", "content": None}})
                self.job.error = "Este formulario MCP no está integrado; no se han enviado datos ni concedido permisos."
                return []
            questions = params.get("questions") or []
            if len(questions) > 3 or any(
                q.get("isSecret") or not q.get("options") for q in questions
            ):
                self.send({"id": event["id"], "result": {"answers": {}}})
                self.job.error = "El agente solicitó datos no compatibles con esta autorización; no se han concedido permisos."
                return []
            public = {
                "id": identifier,
                "method": method,
                "description": self.job.redact_mcp(
                    str(
                        params.get("message")
                        or params.get("command")
                        or params.get("reason")
                        or "El agente solicita autorización."
                    )
                )[:4000],
                "questions": [
                    {
                        "id": str(q["id"]),
                        "question": self.job.redact_mcp(str(q["question"]))[:4000],
                        "options": [
                            {
                                "label": str(o["label"])[:300],
                                "description": self.job.redact_mcp(str(o.get("description", "")))[
                                    :1000
                                ],
                            }
                            for o in q["options"][:10]
                        ],
                    }
                    for q in questions
                ],
            }
            if method in (
                "item/commandExecution/requestApproval",
                "item/fileChange/requestApproval",
            ):
                details = self.job.redact_mcp(json.dumps(params, ensure_ascii=False, indent=2))
                if len(details) > 20_000:
                    self.send({"id": event["id"], "result": {"decision": "decline"}})
                    self.job.error = (
                        "La solicitud excede el límite de revisión; no se ha autorizado."
                    )
                    return []
                public["description"] = "Solicitud completa del agente:\n" + details
            tool_arguments = params.get("_meta", {}).get("tool_params")
            if tool_arguments is not None:
                details = self.job.redact_mcp(
                    json.dumps(tool_arguments, ensure_ascii=False, indent=2)
                )
                if len(details) > 20_000:
                    self.send({"id": event["id"], "result": {"action": "decline", "content": None}})
                    self.job.error = "Los argumentos de aprobación exceden el límite de revisión; no se ha autorizado la llamada."
                    return []
                public["description"] += "\nArgumentos de la herramienta:\n" + details
            with self.job.lock:
                if len(self.pending) >= 8:
                    self.send(
                        {
                            "id": event["id"],
                            "error": {"code": -32000, "message": "Too many pending approvals"},
                        }
                    )
                    self.job.error = (
                        "Demasiadas aprobaciones pendientes; no se ha concedido acceso."
                    )
                else:
                    self.pending[identifier] = (method, params, event["id"])
                    self.job.pending_approvals.append(public)
            self.job.emit("Esperando aprobación manual en el IDE.", from_tool=False)
        if method == "turn/completed":
            self.done.set()
            turn = params.get("turn") or {}
            if turn.get("status") != "completed":
                return [
                    {"type": "turn.failed", "error": turn.get("error") or "Turno interrumpido."}
                ]
        if method == "item/completed":
            item = params.get("item") or {}
            kind = item.get("type")
            if kind == "agentMessage":
                return [
                    {
                        "type": "item.completed",
                        "item": {"type": "agent_message", "text": item.get("text", "")},
                    }
                ]
            if kind == "commandExecution":
                return [
                    {
                        "type": "item.completed",
                        "item": {
                            "type": "command_execution",
                            "status": item.get("status"),
                            "exit_code": item.get("exitCode"),
                            "aggregated_output": item.get("aggregatedOutput", ""),
                        },
                    }
                ]
            if kind == "mcpToolCall":
                return [{"type": "item.completed", "item": {**item, "type": "mcp_tool_call"}}]
        if method == "error" and not params.get("willRetry"):
            self.done.set()
            return [{"type": "turn.failed", "error": params.get("error")}]
        return []
