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

"""Utility methods for the TensorFlow Profiler UI."""
import os
from tensorflow import gfile
from constants import PROFILER_LOG_DIR


def remove_tmp_files():
  """Removes temporary files created by the profiler."""
  for file_name in gfile.ListDirectory(PROFILER_LOG_DIR):
    if 'profiler-ui.' in file_name:
      gfile.Remove(os.path.join(PROFILER_LOG_DIR, file_name))

def prepare_tmp_dir():
  """Prepares a directory for temporary files created by the profiler."""
  if not gfile.Exists(PROFILER_LOG_DIR):
    gfile.MakeDirs(PROFILER_LOG_DIR)
  else:
    remove_tmp_files()
