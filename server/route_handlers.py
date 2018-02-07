# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Route handlers for the TensorFlow Profiler UI."""
import json
import os
import subprocess
from time import time as now
from constants import MDC_BASE_URL
from constants import PROFILER_LOG_DIR
from constants import PROFILER_LOG_PATH
from constants import PROFILER_PPROF_IMAGE_PATH
from constants import PROFILER_TIMELINE_HTML_PATH
from utils import remove_tmp_files
import flask
from tensorflow import gfile
from tensorflow.python import pywrap_tensorflow as pwtf
from tensorflow.python.profiler import model_analyzer
from tensorflow.python.profiler import profile_context


def handle_loading_page():
  """Handles loading page requests."""
  return flask.render_template('loading.html')

def handle_home_page():
  """Handles home page requests."""
  return flask.render_template(
      'default.html', timestamp=now(), mdc_base_url=MDC_BASE_URL)

def handle_profile_api():
  """Handles profile API requests."""
  options = json.loads(flask.request.args.get('options'))

  # Determine view and output format.
  if options['view'] == 'pprof':
    output_format = 'pprof'
    options['view'] = 'code'
  elif options['view'] == 'graph':
    output_format = 'timeline'
  else:
    output_format = 'file'

  # Produce a profile.
  options['output'] = output_format + ':outfile=' + PROFILER_LOG_PATH
  opts = model_analyzer._build_options(options)  # pylint: disable=protected-access
  pwtf.Profile(options['view'].encode('utf-8'), opts.SerializeToString())

  if output_format == 'pprof':
    return produce_pprof_profile()
  elif output_format == 'timeline':
    return produce_timeline_profile()
  else:
    return load_profile(PROFILER_LOG_PATH)

def produce_pprof_profile():
  """Produces a pprof profile."""
  subprocess.call([
      'pprof', '-svg', '--nodecount=100', '--sample_index=1',
      '-output={}'.format(PROFILER_PPROF_IMAGE_PATH), PROFILER_LOG_PATH
  ])
  return load_profile(PROFILER_PPROF_IMAGE_PATH)

def produce_timeline_profile():
  """Produces a timeline profile."""
  # Find the largest profile, since every step is profiled for the "graph"
  # view, and the largest step tends to be the most informative.
  # TODO: Optimize backend to only process largest step in this scenario.
  largest_profile_size = 0
  for file_name in gfile.ListDirectory(PROFILER_LOG_DIR):
    if 'profiler-ui.log_' in file_name:
      file_path = os.path.join(PROFILER_LOG_DIR, file_name)
      with gfile.GFile(file_path, 'rb') as profile:
        file_size = profile.size()
        if largest_profile_size < file_size:
          largest_profile_size = file_size
          path = os.path.join(PROFILER_LOG_DIR, file_name)
  return load_profile(path)

def load_profile(path):
  """Returns profile contents and removes temporary files."""
  if not gfile.Exists(path):
    return 'Profile was not generated.'

  with gfile.GFile(path, 'rb') as profile:
    response = profile.read()
  remove_tmp_files()
  return response
