# TensorFlow Profiler UI

The TensorFlow Profiler (TFProf) UI provides a visual interface for profiling TensorFlow models.

# Installation
1) Install Python dependencies.
   ```s
   pip install --user -r requirements.txt
   ```
2) Install [pprof](https://github.com/google/pprof#building-pprof).
3) Create a [profile context](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/core/profiler/README.md#quick-start).
3) Start the UI.
   ```s
   python ui.py --profile_context_path=/path/to/your/profile.context
   ```

# Learn more
You can learn more about the TensorFlow Profiler's Python API and CLI [here](https://github.com/tensorflow/tensorflow/blob/master/tensorflow/core/profiler/README.md#quick-start).

# Screenshot
<img src="docs/images/preview.png">

# Contributing
Please see [our contributor's guide](/CONTRIBUTING.md)
