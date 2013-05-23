/* global Tyrtle:true */
(function (window) {

  /**
   * Tyrtle renderer/reporter for Karma
   * @param {Object} karma Karma runner instance
   */
  function TyrtleKarmaRenderer(karma) {
    this.karma = karma;
  }

  /**
   * Invoked before all the tests are run, it reports complete number of tests
   * @param  {Object} tyrtle The runner object
   */
  TyrtleKarmaRenderer.prototype.beforeRun = function (tyrtle) {
    this.karma.info({
      // count number of tests in each of the modules
      total: tyrtle.modules.reduce(function(memo, currentModule ) {
        return memo + currentModule.tests.length;
      }, 0)
    });
  };

  /**
   * Invoked after all the tests are finished running with unit tests runner
   * as a first parameter. `window.__coverage__` is provided by Karma. This function
   * basically notifies Karma that unit tests runner is done.
   */
  TyrtleKarmaRenderer.prototype.afterRun = function (/* tyrtle */) {
    this.karma.complete({
      coverage: window.__coverage__
    });
  };

  /**
   * Invoked after each test, used to provide Karma with feedback for each of the tests
   * @param  {Object} test   current test object
   * @param  {Object} module instance of Tyrtle module to which this test belongs
   */
  TyrtleKarmaRenderer.prototype.afterTest = function (test, module/*, tyrtle */) {
    this.karma.result({
      description: test.name,
      suite: [module.name + "#"] || [],
      success: test.status === Tyrtle.PASS,
      log: [test.statusMessage] || [],
      time: test.runTime
    });
  };

  /**
   * Creates instance of Tyrtle to run the tests.
   *
   * Returned start function is invoked by Karma runner when Karma is ready
   * (connected with a browser and loaded all the required files).
   *
   * When invoked, the start function will AMD require the list of test files
   * (saved by Karma in window.__karma__.files) and set them as test modules
   * for Tyrtle and then invoke Tyrtle runner to kick off tests.
   *
   * @param  {Object} karma Karma runner instance
   * @return {Function}     start function that will collect test modules and kick off Tyrtle runner
   */
  function createStartFn(karma) {
    var runner = new Tyrtle({});
    // TODO: Possibly move the use of Tyrtle to the returned fn so that only when
    // actually starting the tests and after all the AMD is required it would be used
    Tyrtle.setRenderer(new TyrtleKarmaRenderer(karma));
    return function () {
      // possibly var Tyrtle = require('Tyrtle');
      var testFiles = Object.keys(window.__karma__.files)
        .filter(RegExp.prototype.test.bind(/-test\.js$/))
        .map(function (testFile) {
          return testFile.replace('/base/public/', '').replace('.js', '');
        });
      require(testFiles, function (testModules) {
        // test files can return a single module, or an array of them.
        testFiles.forEach(function (testFile) {
          var testModule = require(testFile);
          if (!Array.isArray(testModule)) {
            testModule = [testModule];
          }
          testModule.forEach(function (aModule, index) {
            aModule.setAMDName(testFile, index);
            runner.module(aModule);
          });
        });
        runner.run();
      });

    };
  }

  /**
   * Returned function is used for logging by Karma
   */
  function createDumpFn(karma, serialize) {
    return function () {
      karma.info({ dump: [].slice.call(arguments) });
    };
  }

  window.__karma__.start = createStartFn(window.__karma__);
  window.dump = createDumpFn(window.__karma__, function (value) {
    return value;
  });
})(window);
