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

"""Constants for the TensorFlow Profiler UI."""
import os

# Locations for temporary files.
PROFILER_LOG_DIR = '/tmp/tensorflow/profiler'
PROFILER_LOG_PATH = os.path.join(PROFILER_LOG_DIR, 'profiler-ui.log')
PROFILER_PPROF_IMAGE_PATH = os.path.join(PROFILER_LOG_DIR,
                                         'profiler-ui.pprof.png')
PROFILER_TIMELINE_HTML_PATH = os.path.join(PROFILER_LOG_DIR, 'profiler-ui.html')

# Limits on computation per trace.
MAX_SERVING_SECS = 60 * 60
MAX_TRACING_SECS = 300
TRACE_STEPS = 5

# Location and version of Material library.
MDC_BASE_URL = 'https://unpkg.com/material-components-web@0.20.0/dist/'
