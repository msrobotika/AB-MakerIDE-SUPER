"""v0.6 hardware profile, deterministic wiring risks and HTTP safety tests."""
import http.client
import importlib.util
import json
from pathlib import Path
import sys
import threading
import unittest
from unittest.mock import patch
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from hardware_lab import PROFILES, check, inspect_sketch, public_profiles
spec=importlib.util.spec_from_file_location('ab06server',ROOT/'server.py')
server=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=server
spec.loader.exec_module(server)

class ProfileTests(unittest.TestCase):
 def test_physical_ideaspark_matches_observed_setup(self):
  self.assertEqual(PROFILES['ideaspark-19']['resolution'],[170,320])
  self.assertEqual(PROFILES['ideaspark-19']['pins'],{'MOSI':23,'SCLK':18,'CS':15,'DC':2,'RST':4,'BL':32})
 def test_generic_has_no_unverified_reserved_tft(self):
  self.assertEqual(PROFILES['esp32-generic']['pins'],{})
 def test_no_external_components_is_reviewable_but_not_certified(self):
  r=check('ideaspark-19',[])
  self.assertEqual(r['errors'],0);self.assertTrue(r['ready_for_review']);self.assertIn('NO comprueba',r['disclaimer'])
 def test_display_pin_collision(self):
  r=check('ideaspark-19',[{'kind':'led','gpio':2,'voltage':3.3}])
  self.assertIn('display_conflict',[x['code'] for x in r['issues']]);self.assertGreater(r['errors'],0)
 def test_esp_input_only_rejected_for_output(self):
  self.assertIn('input_only',[x['code'] for x in check('esp32-generic',[{'kind':'led','gpio':34}])['issues']])
 def test_esp_input_only_valid_as_analog(self):
  self.assertEqual(check('esp32-generic',[{'kind':'analog','gpio':34}])['errors'],0)
 def test_adc2_wifi_warned(self):
  self.assertIn('wifi_adc2',[x['code'] for x in check('esp32-generic',[{'kind':'analog','gpio':25}],wifi=True)['issues']])
 def test_adc2_without_wifi_no_adc2_warning(self):
  self.assertNotIn('wifi_adc2',[x['code'] for x in check('esp32-generic',[{'kind':'analog','gpio':25}],wifi=False)['issues']])
 def test_overvoltage_rejected(self):
  r=check('esp32-generic',[{'kind':'button','gpio':13,'voltage':5}]);self.assertIn('overvoltage',[x['code'] for x in r['issues']])
 def test_gpios_multiple_assigned_error(self):
  r=check('esp32-generic',[{'kind':'led','gpio':13},{'kind':'button','gpio':13}]);self.assertIn('gpio_conflict',[x['code'] for x in r['issues']])
 def test_relay_cautions(self):
  r=check('esp32-generic',[{'kind':'relay','gpio':16}]);self.assertIn('relay_driver',[x['code'] for x in r['issues']]);self.assertEqual(r['errors'],0)
 def test_servo_requires_power_review(self):
  self.assertIn('servo_power',[x['code'] for x in check('esp32-generic',[{'kind':'servo','gpio':16}])['issues']])
 def test_unrecognized_pin_fails(self):
  for p in [True,'13',-1,40]:
   with self.subTest(pin=p), self.assertRaises(ValueError):check('ideaspark-19',[{'kind':'led','gpio':p}])
 def test_unrecognized_component_fails(self):
  with self.assertRaises(ValueError):check('ideaspark-19',[{'kind':'secret','gpio':13}])
 def test_more_than_32_blocked(self):
  with self.assertRaises(ValueError):check('ideaspark-19',[{'kind':'led','gpio':13}]*33)
 def test_bad_voltage_fails(self):
  for v in [-1,25,True,'5']:
   with self.subTest(voltage=v),self.assertRaises(ValueError):check('ideaspark-19',[{'kind':'led','gpio':13,'voltage':v}])
 def test_read_only_code_lcd_prefix(self):
  r=inspect_sketch('ideaspark-19','#define LCD_DC 13\n#define LCD_CS 15\n');self.assertEqual(len(r['warnings']),1)
 def test_read_only_code_tft_prefix(self):
  r=inspect_sketch('ideaspark-19','#define TFT_DC 2\n');self.assertEqual(r['warnings'],[])
 def test_no_script_execution(self):
  r=inspect_sketch('ideaspark-19','"; __import__("os").system("echo hi");');self.assertTrue(r['ok'])

class ApiTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.app=server.ThreadingHTTPServer(('127.0.0.1',0),server.IDEHandler)
  cls.thread=threading.Thread(target=cls.app.serve_forever,daemon=True);cls.thread.start()
 @classmethod
 def tearDownClass(cls):
  cls.app.shutdown();cls.app.server_close();cls.thread.join(3)
 def call(self,method,path,body=None,headers=None):
  c=http.client.HTTPConnection('127.0.0.1',self.app.server_port,timeout=5)
  h={'Content-Type':'application/json',**(headers or {})}
  c.request(method,path,body=json.dumps(body) if body is not None else None,headers=h)
  r=c.getresponse();status=r.status;data=json.loads(r.read());c.close();return status,data
 def test_no_secret_to_read_profiles(self):
  s,d=self.call('GET','/api/hardware/profiles');self.assertEqual(s,200);self.assertIn('ideaspark-19',d['profiles'])
 def test_requires_session_for_wiring_check(self):
  s,_=self.call('POST','/api/hardware/check',{'profile':'ideaspark-19','connections':[]});self.assertEqual(s,403)
 def test_allowed_session_can_check(self):
  s,d=self.call('POST','/api/hardware/check',{'profile':'ideaspark-19','connections':[]},{'X-AB-Session':server.SESSION_KEY});self.assertEqual(s,200);self.assertEqual(d['errors'],0)
 def test_external_origin_denied_with_token(self):
  s,_=self.call('POST','/api/hardware/check',{'profile':'ideaspark-19','connections':[]},{'X-AB-Session':server.SESSION_KEY,'Origin':'https://attacker.example'});self.assertEqual(s,403)
 def test_bad_gpio_no_write(self):
  with patch.object(server,'command_result',side_effect=AssertionError('Must not execute tools')):
   s,_=self.call('POST','/api/hardware/check',{'profile':'ideaspark-19','connections':[{'kind':'led','gpio':123}]},{'X-AB-Session':server.SESSION_KEY});self.assertEqual(s,400)
 def test_sketch_read_only(self):
  s,d=self.call('POST','/api/hardware/sketch',{'profile':'ideaspark-19','code':'#define LCD_CS 13'},{'X-AB-Session':server.SESSION_KEY});self.assertEqual(s,200);self.assertTrue(d['warnings'])

if __name__=='__main__':unittest.main()
