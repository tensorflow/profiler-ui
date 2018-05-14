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

"""Serves the TensorFlow Profiler UI."""
import os
import threading
import webbrowser
import flask
from .route_handlers import handle_home_page
from .route_handlers import handle_loading_page
from .route_handlers import handle_profile_api
from .utils import prepare_tmp_dir


def start_server(port):
  """Starts Flask web server."""

  # Define and prepare directories.
  resources_dir = os.path.dirname(os.path.realpath(__file__))
  static_dir = os.path.join(resources_dir, 'static')
  templates_dir = os.path.join(resources_dir, 'templates')
  prepare_tmp_dir()

  # Create Flask app.
  app = flask.Flask(
      __name__, static_folder=static_dir, template_folder=templates_dir)

  # Enable verbose error messages.
  app.config['PROPAGATE_EXCEPTIONS'] = True

  # Disable HTML caching.
  app.config['TEMPLATES_AUTO_RELOAD'] = True

  # Define routes.
  @app.route('/')
  def home():
    """Responds to request for home page."""
    return handle_home_page()

  @app.route('/profile')
  def profile():
    """Responds to request for profile API."""
    # Build options.
    return handle_profile_api()

  @app.route('/loading')
  def loading():
    """Responds to request for loading page."""
    return handle_loading_page()

  # Define URL.
  host = '0.0.0.0'
  url = 'http://{}:{}'.format(host, port)

  # Open new browser window after short delay.
  threading.Timer(1, lambda: webbrowser.open(url)).start()

  # Starting the server, and then opening browser after a delay
  app.run(host, port, threaded=True)
