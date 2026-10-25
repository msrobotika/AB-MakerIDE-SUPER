"""Real local HTTP requests and temporary paths; never upload or launch an AI CLI."""
import ast
from contextlib import contextmanager
import http.client
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch

import agent_projects as projects
import agent_runtime as agents
import jobs
import launch
import server

ROOT = Path(__file__).resolve().parents[1]


class LocalHTTPBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.IDEHandler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join(3)

    def call(self, method='GET', path='/api/session', headers=(), body=b'{}'):
        conn = http.client.HTTPConnection('127.0.0.1', self.http.server_port, timeout=5)
        conn.putrequest(method, path, skip_host=True, skip_accept_encoding=True)
        headers = list(headers)
        if not any(name.lower() == 'host' for name, _ in headers):
            headers.append(('Host', f'127.0.0.1:{self.http.server_port}'))
        if method == 'POST':
            headers.extend([('Content-Type', 'application/json'), ('Content-Length', str(len(body)))])
        for name, value in headers:
            conn.putheader(name, value)
        conn.endheaders(body if method == 'POST' else None)
        response = conn.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        conn.close()
        return result

    def test_listener_is_loopback(self):
        self.assertEqual(self.http.socket.getsockname()[0], '127.0.0.1')
        tree = ast.parse((ROOT / 'server.py').read_text(encoding='utf-8-sig'))
        bindings = [call.args[0] for call in ast.walk(tree)
                    if isinstance(call, ast.Call) and isinstance(call.func, ast.Name)
                    and call.func.id == 'ThreadingHTTPServer']
        self.assertEqual(len(bindings), 1)
        self.assertEqual(bindings[0].elts[0].value, '127.0.0.1')

    def test_only_exact_loopback_authorities(self):
        port = self.http.server_port
        for host in (f'127.0.0.1:{port}', f'localhost:{port}', f'LOCALHOST:{port}'):
            with self.subTest(host=host):
                self.assertEqual(self.call(headers=[('Host', host)])[0], 200)
        for host in ('evil.test', f'evil.test:{port}', '127.0.0.1', 'localhost',
                     '127.0.0.1:8770' if port != 8770 else '127.0.0.1:1',
                     f'localhost:{port + 1}', f'localhost:{port}:extra',
                     f'127.0.0.1.evil.test:{port}', f'user@localhost:{port}',
                     f'localhost.:{port}', f'localhost:{port}/', f'[::1]:{port}', ''):
            with self.subTest(host=host):
                status, _, body = self.call(headers=[('Host', host)])
                self.assertEqual(status, 403)
                self.assertNotIn(server.SESSION_KEY.encode(), body)

    def test_duplicate_host_rejected(self):
        host = f'127.0.0.1:{self.http.server_port}'
        self.assertEqual(self.call(headers=[('Host', host), ('Host', host)])[0], 403)

    def test_origin_must_match_scheme_host_and_port(self):
        port = self.http.server_port
        self.assertEqual(self.call(headers=[('Origin', f'http://127.0.0.1:{port}')])[0], 200)
        for origin in (f'https://127.0.0.1:{port}', f'http://localhost:{port}',
                       f'http://127.0.0.1:{port + 1}', 'null', '', 'https://evil.test',
                       f'http://user@127.0.0.1:{port}', f'http://127.0.0.1:{port}/path',
                       f'http://127.0.0.1:{port}?query', f'http://127.0.0.1:{port}#fragment'):
            with self.subTest(origin=origin):
                self.assertEqual(self.call(headers=[('Origin', origin)])[0], 403)

    def test_duplicate_origin_rejected(self):
        origin = f'http://127.0.0.1:{self.http.server_port}'
        self.assertEqual(self.call(headers=[('Origin', origin)] * 2)[0], 403)

    def test_fetch_metadata_blocks_foreign_reads_and_posts(self):
        for method in ('GET', 'POST'):
            for site in ('cross-site', 'same-site'):
                with self.subTest(method=method, site=site):
                    headers = [('Sec-Fetch-Site', site), ('X-AB-Session', server.SESSION_KEY)]
                    self.assertEqual(self.call(method, '/api/hardware/check', headers)[0], 403)

    def test_every_post_requires_token_before_dispatch(self):
        paths = ('/api/upload', '/api/verify', '/api/jobs/start', '/api/jobs/cancel',
                 '/api/agents/start', '/api/agents/cancel', '/api/serial/start', '/api/serial/stop',
                 '/api/serial/send', '/api/ai/config', '/api/ai/reset', '/api/ai/chat',
                 '/api/libraries/install', '/api/libraries/search', '/api/terminal/command',
                 '/api/terminal/install-core', '/api/hardware/check', '/api/hardware/sketch',
                 '/api/advisor/check', '/api/unknown')
        with patch.object(server, 'check_hardware') as action, patch.object(server.AGENT_JOBS, 'start') as agent:
            for path in paths:
                for headers in ((), [('X-AB-Session', 'wrong')], [('X-AB-Session', 'é')]):
                    with self.subTest(path=path, headers=headers):
                        self.assertEqual(self.call('POST', path, headers)[0], 403)
            action.assert_not_called()
            agent.assert_not_called()

    def test_valid_token_allows_only_trusted_request(self):
        status, headers, body = self.call()
        self.assertEqual(status, 200)
        token = json.loads(body)['csrf']
        self.assertGreaterEqual(len(token), 40)
        self.assertEqual(headers['Cache-Control'], 'no-store')
        self.assertNotIn('Access-Control-Allow-Origin', headers)
        with patch.object(server, 'check_hardware', return_value={'ok': True}) as action:
            self.assertEqual(self.call('POST', '/api/hardware/check', [('X-AB-Session', token)])[0], 200)
            action.assert_called_once()
            for extra in ([('Origin', 'https://evil.test')], [('Sec-Fetch-Site', 'cross-site')],
                          [('X-AB-Session', token)], [('Host', 'localhost:1')]):
                self.assertEqual(self.call('POST', '/api/hardware/check', [('X-AB-Session', token), *extra])[0], 403)
            action.assert_called_once()

    def test_old_token_rejected_after_rotation(self):
        old = server.SESSION_KEY
        with patch.object(server, 'SESSION_KEY', 'replacement-session-key-for-test'):
            self.assertEqual(self.call('POST', '/api/hardware/check', [('X-AB-Session', old)])[0], 403)

    def test_absolute_and_network_path_targets_rejected(self):
        for target in ('http://evil.test/api/session', '//evil.test/api/session'):
            self.assertEqual(self.call(path=target)[0], 403)

    def test_preflight_does_not_allow_cross_origin(self):
        status, headers, _ = self.call('OPTIONS', '/api/upload', [('Origin', 'https://evil.test')])
        self.assertNotEqual(status, 200)
        self.assertNotIn('Access-Control-Allow-Origin', headers)

    def test_duplicate_content_type_and_framing_rejected(self):
        for extra in ([('Content-Type', 'text/plain')], [('Content-Length', '2')], [('Transfer-Encoding', 'chunked')]):
            self.assertEqual(self.call('POST', '/api/hardware/check', [('X-AB-Session', server.SESSION_KEY), *extra])[0], 400)


@contextmanager
def redirected_directory(link, destination):
    if os.name == 'nt':
        result = subprocess.run(['cmd.exe', '/d', '/c', 'mklink', '/J', str(link), str(destination)],
                                capture_output=True, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        if result.returncode:
            raise AssertionError('Could not create temporary Windows junction')
    else:
        link.symlink_to(destination, target_is_directory=True)
    try:
        yield link
    finally:
        if os.name == 'nt':
            os.rmdir(link)  # Remove this junction itself; never recurse into its target.
        else:
            link.unlink()


class ProjectPathBoundaryTests(unittest.TestCase):
    def test_rejects_escapes_aliases_windows_devices_and_control_characters(self):
        for name in ('../outside.h', '/outside.h', 'C:/outside.h', 'folder\\outside.h',
                     'folder/../outside.h', './outside.h', 'folder//outside.h',
                     'folder/./outside.h', 'folder/', 'a\x00.h', 'a\n.h', 'a:stream',
                     'CON', 'nul.txt', 'folder/COM1.h', 'LPT9.py', 'folder./a.h',
                     'folder /a.h', 'file.h.', 'file.h ', 'a?.h', 'a|b.h'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                projects.validate_project_files({name: b'blocked'})

    def test_case_and_file_directory_collisions_rejected(self):
        for files in ({'code.h': b'a', 'CODE.H': b'b'}, {'folder': b'a', 'folder/code.h': b'b'}):
            with self.assertRaises(ValueError):
                projects.validate_project_files(files)

    def test_nested_regular_files_are_portable_and_exportable(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            project = root / 'sesion-valid'; (project / 'include').mkdir(parents=True)
            (project / 'sketch.ino').write_text('void setup(){}')
            (project / 'include' / 'config.h').write_text('#define PIN 13')
            self.assertEqual(set(projects.collect_project(project, root)), {'sketch.ino', 'include/config.h'})

    def test_redirected_store_blocks_agent_build_and_launcher(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp); outside = base / 'outside'; outside.mkdir()
            with redirected_directory(base / 'redirected', outside) as link:
                agent = agents.AgentJobManager(link / 'agents')
                with patch.object(agents.shutil, 'which', return_value='/fake/cli'), patch.object(agent, '_work') as worker:
                    with self.assertRaises(ValueError):
                        agent.start(provider='codex', mode='supervisado', prompt='Test project', code='', lang='cpp', fqbn='arduino:avr:uno', confirmed=True)
                    worker.assert_not_called()
                build = jobs.JobManager(threading.Lock(), link / 'builds')
                with patch.object(build, '_worker') as worker:
                    with self.assertRaises(ValueError):
                        build.start('void setup(){}', 'arduino:avr:uno')
                    worker.assert_not_called()
                with patch.dict(os.environ, AB_MAKERIDE_DATA_DIR=str(link / 'data')):
                    result = launch.diagnose(port=0)
                self.assertFalse(next(check for check in result['checks'] if check['name'] == 'data')['ok'])
                self.assertEqual(list(outside.iterdir()), [])

    def test_export_and_recovery_reject_redirected_workspace(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); outside = root / 'outside'; outside.mkdir()
            (outside / 'sketch.ino').write_text('PRIVATE OUTSIDE')
            with redirected_directory(root / 'sesion-redirected', outside) as link:
                with self.assertRaises(ValueError):
                    projects.collect_project(link, root)
                self.assertIsNone(agents._safe_workspace_file(link, 'sketch.ino'))
                self.assertIsNone(agents.restore_journal(link))
                self.assertIsNone(agents.recover_legacy_workspace(link))

    def test_export_skips_redirected_subdirectory(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); outside = root / 'outside'; outside.mkdir()
            project = root / 'sesion-normal'; project.mkdir()
            (project / 'sketch.ino').write_text('SAFE')
            (outside / 'private.h').write_text('PRIVATE OUTSIDE')
            with redirected_directory(project / 'include', outside):
                self.assertEqual(set(projects.collect_project(project, root)), {'sketch.ino'})

    def test_hard_link_cannot_leak_or_overwrite_external_file(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); outside = root / 'private.txt'; outside.write_text('PRIVATE OUTSIDE')
            project = root / 'sesion-normal'; project.mkdir()
            os.link(outside, project / 'private.h')
            os.link(outside, project / (agents.JOURNAL_FILENAME + '.tmp'))
            os.link(outside, project / 'job.tmp')
            self.assertEqual(projects.collect_project(project, root), {})
            self.assertIsNone(agents._safe_workspace_file(project, 'private.h'))
            agent = agents.AgentJob('a' * 32, 'codex', 'consultar', project, 'sketch.ino', '')
            agent.persist()
            job = jobs.Job('b' * 32, 'compile'); job.journal = project / 'job.json'
            job.persist(force=True)
            self.assertEqual(outside.read_text(), 'PRIVATE OUTSIDE')

    def test_project_identifier_never_becomes_path(self):
        with tempfile.TemporaryDirectory() as temp:
            manager = jobs.JobManager(threading.Lock(), Path(temp) / 'builds')
            for identifier in ('../outside', '/absolute', 'C:\\outside', 'x' * 32):
                with self.subTest(identifier=identifier), self.assertRaises(ValueError):
                    manager.start('', 'arduino:avr:uno', request_id=identifier)
            self.assertFalse(manager._hardware_lock.locked())

    def test_production_subprocess_calls_do_not_enable_shell(self):
        found = 0
        for path in ROOT.glob('*.py'):
            tree = ast.parse(path.read_text(encoding='utf-8-sig'))
            for call in ast.walk(tree):
                if not isinstance(call, ast.Call) or not isinstance(call.func, ast.Attribute):
                    continue
                if not isinstance(call.func.value, ast.Name) or call.func.value.id != 'subprocess':
                    continue
                if call.func.attr not in ('run', 'Popen', 'call', 'check_output', 'check_call'):
                    continue
                found += 1
                self.assertFalse(any(kw.arg == 'shell' and not (isinstance(kw.value, ast.Constant) and kw.value.value is False) for kw in call.keywords), str(path))
                self.assertFalse(call.args and isinstance(call.args[0], ast.Constant) and isinstance(call.args[0].value, str), str(path))
        self.assertGreaterEqual(found, 7)


if __name__ == '__main__':
    unittest.main()
