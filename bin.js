const Http = require("http");
const Micro = require("micro");
const minimist = require("minimist");

const { getHandler } = require("./lib/getHandler");
const { assert } = require("./lib/assert");

function help() {
  console.log(
    [
      "OPTIONS", //
      "  -r, --root ROOT: root directory",
      "  -p, --port PORT: port (default: 8044)",
      "  -h, --help: show help",
    ].join("\n\n")
  );
}

function getParams() {
  try {
    const argv = minimist(process.argv.slice(2));

    if (argv.h || argv.help) {
      help();
      process.exit(0);
    }

    const root = argv.r || argv.root;
    assert(typeof root === "string", "invalid root");
    const port = parseInt(argv.p || argv.port || 8044);
    assert(Number.isSafeInteger(port), "invalid port");

    return { root, port };
  } catch (e) {
    console.error(e);
    help();
    process.exit(1);
  }
}

const params = getParams();
const requestListener = Micro.serve(getHandler({ root: params.root }));
const server = new Http.Server(requestListener);
server.listen(params.port);
