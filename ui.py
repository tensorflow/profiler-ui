#!/usr/bin/env python

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

"""CLI for the TensorFlow Profiler UI."""
import sys
from server.server import start_server
import tensorflow as tf
from tensorflow import flags
from tensorflow.python.pywrap_tensorflow import ProfilerFromFile


# Define flags.
FLAGS = flags.FLAGS
flags.DEFINE_integer('server_port', 7007, 'Flask server port.')
flags.DEFINE_string('profile_context_path', '', 'Path to profile context.')


def main(_):
  if not FLAGS.profile_context_path:
    sys.stderr.write('Please provide a value for "profile_context_path".\n')
    return

  # Create profiler from profile context.
  ProfilerFromFile(FLAGS.profile_context_path)

  # Start server.
  start_server(FLAGS.server_port)


if __name__ == '__main__':
  tf.app.run()
