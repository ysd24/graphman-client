
const GRAPHMAN_HOME = 'GRAPHMAN_HOME';
const SUPPORTED_OPERATIONS = ["version", "export", "import", "explode", "implode", "combine", "diff", "renew", "revise", "mappings", "schema", "validate"];
const GRAPHMAN_OPERATION_MODULE_PREFIX = "./graphman-operation-";
const args = process.argv.slice(2);
const op = args[0];
const utils = require("./graphman-utils");
const graphman = require("./graphman");

try {
    init();

    const params = parse(args);

    // initialize configuration and schema metadata
    graphman.init(params);

    if (!op) {
        utils.error("operation is missing");
        utils.print("  supported operations are [" + SUPPORTED_OPERATIONS + "]");
        utils.print("  usage: <operation> <parameter>,...");
        utils.print("  usage: <operation> --help");
        utils.print();
    } else {
        let operation = findOperation(op);
        if (params.help) {
            operation.usage();
        } else {
            operation.run(operation.initParams(params, graphman.configuration()));
        }
    }
} catch (e) {
    if (typeof e === 'string') {
        utils.error(e);
    } else if (typeof e === 'object' && e.name === 'GraphmanOperationError') {
        utils.error(e.message);
    } else if (utils.loggingAt('debug')) {
        console.log(e);
    } else {
        console.log("error encountered while processing the graphman operation, " + `${e.name}, ${e.message}` );
    }
}

function init() {
    if (!process.env[GRAPHMAN_HOME]) {
        throw GRAPHMAN_HOME + " environment variable is not defined";
    }
}

function findOperation(name) {
    if (!SUPPORTED_OPERATIONS.includes(name)) {
        throw "unsupported operation: " + name;
    } else {
        return require(GRAPHMAN_OPERATION_MODULE_PREFIX + name);
    }
}

function parse(args) {
    return require("./args-parser").parse(args.slice(1));
}
