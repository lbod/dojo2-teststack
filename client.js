/*jshint node:true */
if (typeof process !== 'undefined' && typeof define === 'undefined') {
	var req = require('./dojo/dojo');
	req({
		baseUrl: __dirname + '/../',
		packages: [
			{ name: 'dojo-ts', location: __dirname + '/dojo' },
			{ name: 'teststack', location: __dirname }
		]
	}, [ 'teststack/client' ]);
}
else {
	define([
		'./main',
		'./lib/args',
		'dojo-ts/topic',
		'require'
	], function (main, args, topic, require) {
		if (!args.suites) {
			throw new Error('Missing "suites" argument');
		}

		if (args.packages) {
			// TODO: Use of the global require is required for this to work because config mechanics are in global
			// require only; this should probably not be the case
			this.require({ packages: JSON.parse(args.packages) });
		}

		var deps = [].concat(args.suites);

		if (!args.reporter) {
			console.info('Defaulting to "console" reporter');
			args.reporter = 'console';
		}

		// TODO: This is probably a fatal condition and so we need to let the runner know that no more information
		// will be forthcoming from this browser
		if (typeof window !== 'undefined') {
			window.onerror = function (message, url, lineNumber) {
				var error = new Error(message + ' at ' + url + ':' + lineNumber);
				topic.publish('/error', error);
			};
		}
		else if (typeof process !== 'undefined') {
			process.on('uncaughtException', function (error) {
				topic.publish('/error', error);
			});
		}

		// Allow 3rd party reporters to be used simply by specifying a full mid, or built-in reporters by
		// specifying the reporter name only
		deps.push(args.reporter.indexOf('/') > -1 ? args.reporter : './lib/reporters/' + args.reporter);

		require(deps, function () {
			if (args.autoRun !== 'false') {
				main.run();
			}
		});
	});
}