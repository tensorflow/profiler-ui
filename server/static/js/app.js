/**
Copyright 2018 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Renders form fields, crawls them for updates, and sends interaction events
 * through the event bus.
 * @final
 */
class Form {
  /**
   * @param {!EventTarget} eventBus Interaction events will be sent through this
   *     event bus to subscribers.
   */
  constructor(eventBus) {
    /**
     * Handle clicks on the "Profile" button.
     * @private @const {!HTMLElement}
     */
    this.formEl_ =
        /** @type {!HTMLElement} */ (document.querySelector('#sidebar'));

    // Handle clicks on the "Profile" button.
    const profileButtonEl = this.formEl_.querySelector('.profile-button');
    profileButtonEl.addEventListener('click', (e) => {
      e.preventDefault();
      eventBus.dispatchEvent(new Event('form:click:profile'));
    }, false);
  }

  /**
   * Renders updates to the form fields.
   * @param {!ProfileOptions} profileOptions
   */
  render(profileOptions) {
    // Update an attribute which is used for styling.
    this.formEl_.setAttribute('data-view', profileOptions['view']);

    // Update typed fields.
    const /** !Array<!HTMLInputElement> */ typedFieldEls =
        Array.from(document.querySelectorAll('[data-type]'));
    for (const typedFieldEl of typedFieldEls) {
      // Determine the field's type and value.
      const /** string */ type = typedFieldEl.dataset['type'];
      const /** string */ profileOptionName = typedFieldEl.name;
      const /** (boolean|number|string|!Array<string>) */ profileOptionValue =
          profileOptions[profileOptionName];

      // Update the field element's value or checked property.
      switch (type) {
        case 'boolean':
          typedFieldEl.checked = Boolean(profileOptionValue);
          break;
        case 'number':
        case 'string':
          typedFieldEl.value = String(profileOptionValue);
          break;
        case 'string[]':
          typedFieldEl.value = profileOptionValue.join(', ');
          break;
      }

      // Boolean fields require no further rendering.
      if (type === 'boolean') {
        continue;
      }

      // Update the field's label. If the field is not empty, or if the field
      // currently has focus, the label should float above the field. Otherwise
      // the label will descend and act as placeholder text.
      const /** boolean */ labelShouldFloat = Boolean(typedFieldEl.value) ||
          typedFieldEl === document.activeElement;
      const parentEl = /** @type {!HTMLElement} */ (typedFieldEl.parentElement);
      const labelEl =
          /** @type {!HTMLElement} */ (
              parentEl.querySelector('.mdc-textfield__label'));
      labelEl.classList.toggle(
          'mdc-textfield__label--float-above', labelShouldFloat);
    }

    // Update the "select" profile option's checkboxes.
    const /** !Array<string> */ selectedAttributes = profileOptions['select'];
    const /** !Array<!HTMLInputElement> */ selectCheckboxEls =
        Array.from(document.querySelectorAll('[data-group="select"]'));
    for (const selectCheckboxEl of selectCheckboxEls) {
      selectCheckboxEl.checked =
          selectedAttributes.includes(selectCheckboxEl.value);
    }

    // Update summaries.
    const /** !Array<!HTMLDivElement> */ summaryEls =
        Array.from(document.querySelectorAll('.sidebar .summary'));
    for (const summaryEl of summaryEls) {
      // Optionally hide options which are falsy. (ex: 0 or "")
      const /** boolean */ shouldHideFalsyOptions =
          !!summaryEl.dataset['hideFalsyOptions'];

      // Update each option in the summary.
      const /** !Array<!HTMLDivElement> */ optionEls =
          Array.from(summaryEl.querySelectorAll('[data-option]'));
      for (const optionEl of optionEls) {
        const /** string */ optionName = optionEl.dataset['option'];
        const /** (boolean|number|string|!Array<string>) */ optionValue =
            profileOptions[optionName];

        // Update the option's visibility.
        optionEl.classList.toggle(
            'hidden', shouldHideFalsyOptions && !optionValue);

        // Update the option's value.
        const valueEl =
            /** @type {!HTMLSpanElement} */ (optionEl.querySelector('.value'));
        if (Array.isArray(optionValue)) {
          valueEl.innerText = optionValue.join(', ');
        } else {
          valueEl.innerText = String(optionValue);
        }
      }
    }
  }

  /**
   * Crawls the form fields and updates a set of profile options.
   * @param {!ProfileOptions} profileOptions
   */
  updateProfileOptions(profileOptions) {
    // Crawl typed fields.
    const /** !Array<!HTMLInputElement> */ typedFieldEls =
        Array.from(document.querySelectorAll('[data-type]'));
    for (const typedFieldEl of typedFieldEls) {
      // Determine the field's type and value.
      const /** string */ type = typedFieldEl.dataset['type'];
      const /** string */ profileOptionName = typedFieldEl.name;

      // Update the corresponding profile option.
      switch (type) {
        case 'boolean':
          profileOptions[profileOptionName] = typedFieldEl.checked;
          break;
        case 'number':
          profileOptions[profileOptionName] = Number(typedFieldEl.value);
          break;
        case 'string[]':
          if (typedFieldEl.value.trim()) {
            profileOptions[profileOptionName] =
                typedFieldEl.value.split(',').map((s) => s.trim());
          } else {
            profileOptions[profileOptionName] = [];
          }
          break;
        case 'string':
          profileOptions[profileOptionName] = typedFieldEl.value;
          break;
      }
    }

    // Update the "select" profile option based on its checkboxes.
    const /** !Array<!HTMLInputElement> */ selectCheckboxEls =
        Array.from(document.querySelectorAll('[data-group="select"]'));
    profileOptions['select'] =
        selectCheckboxEls.filter((el) => el.checked).map((el) => el.value);
  }
}

/**
 * Renders the header, and handles clicks by dispatching events to subscribers
 * through the event bus.
 * @final
 */
class Header {
  /**
   * @param {!EventTarget} eventBus Header-related events will be sent through
   *     this event bus to subscribers.
   */
  constructor(eventBus) {
    /**
     * Header-related events will be sent through this event bus to subscribers.
     * @private @const
     */
    this.eventBus_ = eventBus;

    /**
     * The title element contains the logo and title.
     * @private @const
     */
    this.titleEl_ =
        /** @type {!HTMLElement} */ (document.querySelector('header .title'));

    /**
     * Links to change the profile view.
     * @private @const {!Array<!HTMLElement>}
     */
    this.viewLinkEls_ =
        Array.from(document.querySelectorAll('header .view-link'));

    // Listen for events.
    this.addEventListeners_();
  }

  /**
   * Adds events listeners for the header's interactive elements.
   * @private
   */
  addEventListeners_() {
    // Handle clicks on the title element.
    this.titleEl_.addEventListener('click', (e) => {
      if (e) {
        e.preventDefault();
      }

      this.eventBus_.dispatchEvent(new Event('header:click:title'));
    }, false);

    // Handle clicks on the view link elements.
    for (const viewLinkEl of this.viewLinkEls_) {
      const view = viewLinkEl.dataset.view;
      viewLinkEl.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
        }

        // Dispatch a custom event through the event bus, which contains the
        // selected "view" in the "detail" object.
        this.eventBus_.dispatchEvent(
            new CustomEvent('header:click:view', {detail: {view}}));
      }, false);
    }
  }

  /**
   * Renders the header.
   * @param {!ProfileOptions} profileOptions
   */
  render(profileOptions) {
    // Update the selected view link.
    for (const viewLinkEl of this.viewLinkEls_) {
      if (viewLinkEl.dataset.view === profileOptions['view']) {
        viewLinkEl.classList.add('selected');
      } else {
        viewLinkEl.classList.remove('selected');
      }
    }
  }
}

/**
 * Options for the TensorFlow Profiler. These options will be serialized to JSON
 * and sent to the backend. The backend will be expecting specific property
 * names, which are snake_cased. Annotating this type with "dict" will let the
 * compiler know to preserve the property names. Another reason for choosing the
 * "dict" annotation is that it allows properties to be accessed using brackets,
 * instead of dot notation. For example, the application needs enumerate over
 * form fields in the DOM, and update corresponding profile options along the
 * way. This wouldn't be possible with annotations like "record" or "struct",
 * since they enforce dot notation for property access.
 *
 * @dict
 */
class ProfileOptions {
  constructor() {
    /**
     * Affects how the profile will be displayed.
     * @type {string}
     */
    this['view'] = 'graph';

    /**
     * List of one or more attributes to select.
     * @type {!Array<string>}
     */
    this['select'] = ['micros'];

    /**
     * Attribute to order results by, in descending order.
     * @type {string}
     */
    this['order_by'] = 'micros';

    /**
     * Show nodes that are at most this number of hops from starting node in the
     * data structure.
     * @type {number}
     */
    this['max_depth'] = 10000;

    /**
     * Show nodes that request at least this number of bytes.
     * @type {number}
     */
    this['min_bytes'] = 0;

    /**
     * Show nodes that contain at least this number of float operations. Only
     * available if an node has op.RegisterStatistics() defined and OpLogProto
     * is provided.
     * @type {number}
     */
    this['min_float_ops'] = 0;

    /**
     * Show nodes that spend at least this number of microseconds to run. It
     * sums accelerator_micros and cpu_micros. Note: cpu and accelerator can run
     * in parallel.
     * @type {number}
     */
    this['min_micros'] = 0;

    /**
     * Show nodes that appear at least this number of times.
     * @type {number}
     */
    this['min_occurrence'] = 0;

    /**
     * Show nodes that contain at least this number of parameters.
     * @type {number}
     */
    this['min_params'] = 0;

    /**
     * Account and display the nodes whose types match one of the type regexes
     * specified. The TensorFlow Profiler allows users to define extra operation
     * types for graph nodes through the profiler.OpLogProto proto.
     * @type {!Array<string>}
     */
    this['account_type_regexes'] = ['.*'];

    /**
     * If True, only account the statistics of ops eventually displayed. If
     * False, account all op statistics matching -account_type_regexes
     * recursively.
     * @type {boolean}
     */
    this['account_displayed_op_only'] = true;

    /**
     * Nodes that match these regexes will be hidden.
     * @type {!Array<string>}
     */
    this['hide_name_regexes'] = [];

    /**
     * Nodes that match these regexes will be shown.
     * @type {!Array<string>}
     */
    this['show_name_regexes'] = ['.*'];

    /**
     * Show node starting from the node that matches the regexes, recursively.
     * @type {!Array<string>}
     */
    this['start_name_regexes'] = ['.*'];

    /**
     * Hide node starting from the node that matches the regexes, recursively.
     * @type {!Array<string>}
     */
    this['trim_name_regexes'] = [];

    /**
     * Show the stats of the this step when multiple steps of RunMetadata were
     * added. By default, when step is -1, show the average of all steps.
     * @type {number}
     */
    this['step'] = -1;
  }
}

/**
 * Returns a default ProfileOptions object augmented with options from the hash.
 * @return {!ProfileOptions}
 */
function loadProfileOptionsFromHash() {
  try {
    const profileOptions = new ProfileOptions();
    const objectFromHash =
        JSON.parse(decodeURIComponent(location.hash.slice(1)));
    if (objectFromHash && typeof objectFromHash === 'object') {
      Object.assign(
          profileOptions, /** @type {!Object<string, *>} */ (objectFromHash));
    }
    return profileOptions;
  } catch (err) {
    return new ProfileOptions();
  }
}

/**
 * Saves a JSON representation of a ProfileOptions object to the hash.
 * @param {!ProfileOptions} profileOptions
 */
function saveProfileOptionsToHash(profileOptions) {
  location.hash = JSON.stringify(profileOptions);
}

/** The TensorFlow Profiler UI shell. */
class Shell {
  /**
   * @param {!Function} renderTraceWithCatapult Renders trace with Catapult.
   */
  constructor(renderTraceWithCatapult) {
    /**
     * Renders trace JSON with Catapult.
     * @private @const {!Function}
     */
    this.renderTraceWithCatapult_ = renderTraceWithCatapult;

    /**
     * View-related events will be sent through this event bus.
     * @private @const {!EventTarget}
     */
    this.eventBus_ = document.createElement('link');

    /** @private @const {!Header} */
    this.header_ = new Header(this.eventBus_);

    /** @private @const {!Form} */
    this.form_ = new Form(this.eventBus_);

    /**
     * Contains elements where profiles are rendered.
     * @private @const
     */
    this.viewContainerEl_ =
        /** @type {!HTMLDivElement} */ (
            document.querySelector('.profiler-view-container'));

    /**
     * Text profiles are rendered here.
     * @private @const
     */
    this.viewTextEl_ =
        /** @type {!HTMLPreElement} */ (
            document.querySelector('.profiler-view-text'));

    /**
     * SVGs are rendered here.
     * @private @const
     */
    this.viewSvgEl_ =
        /** @type {!HTMLDivElement} */ (
            document.querySelector('.profiler-view-svg'));

    /**
     * Counter used to identify stale responses.
     * @private {number}
     */
    this.queryId_ = 0;

    /**
     * Determines what type of profile to request from the backend.
     * @private {!ProfileOptions}
     */
    this.profileOptions_ = loadProfileOptionsFromHash();

    // Listen for events.
    this.addEventListeners_();

    // Show loading animation, if profile path was defined in URL.
    if (/profile=/.test(location.search.match)) {
      this.showInitialLoadingAnimation_();
    }
  }

  /**
   * Refreshes the shell. Parses options from the hash, renders, and then
   * requests a profile.
   */
  refresh() {
    this.profileOptions_ = loadProfileOptionsFromHash();
    this.header_.render(this.profileOptions_);
    this.form_.render(this.profileOptions_);
    this.requestProfile_();
  }

  /**
   * Crawls the form for updates to profile options and then renders, without
   * sending a new profile request.
   */
  crawlFormAndRenderWithoutSendingRequest() {
    this.form_.updateProfileOptions(this.profileOptions_);
    this.header_.render(this.profileOptions_);
    this.form_.render(this.profileOptions_);
  }

  /**
   * Cleans up the shell by removing event listeners. This method is initially a
   * noop, but will be redefined when "addEventListeners_" is called by the
   * constructor.
   */
  removeEventListeners() {}

  /**
   * Adds events listeners, and updates the "removeEventListeners" method.
   * @private
   */
  addEventListeners_() {
    // Handle header title clicks.
    const handleHeaderTitleClick = () => {
      // Save default profile options to the hash.
      saveProfileOptionsToHash(new ProfileOptions());
    };
    this.eventBus_.addEventListener(
        'header:click:title', handleHeaderTitleClick, false);

    // Handle header view link clicks.
    const handleHeaderViewClick = (e) => {
      // Update and save the profile options.
      this.profileOptions_['view'] = e.detail.view;
      // The graph view has a few restrictions.
      if (this.profileOptions_['view'] === 'graph') {
        this.profileOptions_['select'] = ['micros'];
        this.profileOptions_['order_by'] = 'micros';
      } else {
        this.form_.updateProfileOptions(this.profileOptions_);
      }
      saveProfileOptionsToHash(this.profileOptions_);
    };
    this.eventBus_.addEventListener(
        'header:click:view', handleHeaderViewClick, false);

    // Handle "Profile" button clicks.
    const handleFormProfileClick = () => {
      // Update and save the profile options.
      this.form_.updateProfileOptions(this.profileOptions_);
      saveProfileOptionsToHash(this.profileOptions_);
    };
    this.eventBus_.addEventListener(
        'form:click:profile', handleFormProfileClick, false);

    // Handle hash changes.
    const handleHashChange = () => {
      this.refresh();
    };
    window.addEventListener('hashchange', handleHashChange, false);

    // Update the "removeEventListeners" method.
    this.removeEventListeners = () => {
      this.eventBus_.removeEventListener(
          'header:click:title', handleHeaderTitleClick, false);
      this.eventBus_.removeEventListener(
          'header:click:view', handleHeaderViewClick, false);
      this.eventBus_.removeEventListener(
          'form:click:profile', handleFormProfileClick, false);
      window.removeEventListener('hashchange', handleHashChange, false);
    };
  }

  /**
   * Requests a profile from the backend.
   * @private
   */
  requestProfile_() {
    // Invalidate previous requests.
    this.queryId_++;

    // Save the latest queryId for the current closure.
    const queryId = this.queryId_;

    // Hide the view while the profile is being fetched.
    document.body.classList.add('requesting');

    // Save the expected format of the output.
    let outputFormat = 'text';
    if (this.profileOptions_['view'] === 'graph') {
      outputFormat = 'catapult';
    } else if (this.profileOptions_['view'] === 'pprof') {
      outputFormat = 'svg';
    }

    // Send a request to the backend.
    const url = '/profile?options=' + JSON.stringify(this.profileOptions_);
    fetch(url, {credentials: 'include'})
        .then((response) => {
          if (response.ok) {
            return response.text();
          } else {
            // TODO(cfa): Show more specific error messages.
            outputFormat = 'text';
            return 'The server returned an error.';
          }
        })
        .then((text) => {
          // Filter out stale responses.
          if (queryId !== this.queryId_) {
            return;
          }

          // Handle a special case where an SVG was requested, but the server
          // instead returns a URL.
          if (outputFormat === 'svg' && /^https/.test(text)) {
            const url = text;
            window.open(url);
            outputFormat = 'html';
            text = `Your PPROF graph is available ` +
                `<a href="${url}" target="_blank">here</a>.`;
          }

          // Render the profile.
          this.viewSvgEl_.textContent = '';
          this.viewTextEl_.textContent = '';
          if (outputFormat === 'text') {
            // Render text.
            this.viewContainerEl_.setAttribute('data-view-mode', 'text');
            this.viewTextEl_.textContent = text;
          } else if (outputFormat === 'html') {
            // Render HTML.
            this.viewContainerEl_.setAttribute('data-view-mode', 'text');
            this.viewTextEl_.innerHTML = text;
          } else if (outputFormat === 'svg') {
            // Render PPROF as an SVG.
            this.viewContainerEl_.setAttribute('data-view-mode', 'svg');
            this.viewSvgEl_.innerHTML = text;
            // Resize the SVG.
            const svgEl = /** @type {!SVGElement} */ (
                this.viewSvgEl_.querySelector('svg'));
            const box = svgEl.getBBox();
            svgEl.setAttribute('height', box.height);
            svgEl.setAttribute('width', box.width);
          } else {
            // Render timeline with Catapult.
            this.viewContainerEl_.setAttribute('data-view-mode', 'catapult');
            this.renderTraceWithCatapult_(text);
          }
          document.body.classList.remove('requesting');
        })
        .catch((err) => {
          // Handle timeouts.
          this.viewContainerEl_.setAttribute('data-view-mode', 'text');
          this.viewSvgEl_.textContent = '';
          this.viewTextEl_.textContent = 'The server seems to be offline.';
          document.body.classList.remove('requesting');
        });
  }

  /**
   * Shows the initial loading animation.
   * @private
   */
  showInitialLoadingAnimation_() {
    // Show animation.
    document.body.classList.add('checking-for-profile-context');
    document.title += ' (Tracing)';

    // Check the status.
    fetch('/check').then((response) => response.text()).then((text) => {
      console.log('Response: ' + text);
    });

    // Remove the animation after 5 seconds.
    setTimeout(() => {
      document.body.classList.remove('checking-for-profile-context');
      document.title = document.title.split(' ')[0];
    }, 5000);
  }
}
