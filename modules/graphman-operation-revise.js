
const utils = require("./graphman-utils");
const butils = require("./graphman-bundle");

module.exports = {
    /**
     * Revises the input bundle for import operations.
     * @param params
     * @param params.input input bundle
     * @param params.output output bundle
     * @param params.options name-value pairs used to customize revise operation
     */
    run: function (params) {
        if (!params.input) {
            throw "--input parameter is missing";
        }

        let bundle = utils.readFile(params.input);

        if (params.options.normalize) {
            bundle = butils.sanitize(bundle, butils.IMPORT_USE, params.options);
            butils.removeDuplicates(bundle);
        }

        this.revise(bundle);
        utils.writeResult(params.output, butils.sort(bundle));
    },

    revise: function (bundle) {
        const goidMappings = bundle.goidMappings || [];
        const guidMappings = bundle.guidMappings || [];
        delete bundle.goidMappings;
        delete bundle.guidMappings;

        Object.keys(bundle).filter(key => Array.isArray(bundle[key])).forEach(key => {
            utils.info("inspecting " + key);
            if (goidMappings.length) reviseEntities(bundle[key], goidMappings);
            if (guidMappings.length) reviseEntities(bundle[key], guidMappings);
        });

        return bundle;
    },

    initParams: function (params, config) {
        params.options = Object.assign({
            normalize: false,
            excludeGoids: false
        }, params.options);

        return params;
    },

    usage: function () {
        console.log("revise --input <input-file>");
        console.log("  [--output <output-file>]");
        console.log("  [--options.<name> <value>,...]");
        console.log();
        console.log("Revises the input bundle (which is likely to be result of diff command) as per the GOID and/or GUID mappings");
        console.log();
        console.log("  --input <input-file>");
        console.log("    specify the name of input bundle file that contains gateway configuration");
        console.log();
        console.log("  --output <output-file>");
        console.log("    specify the name of file to capture the revised version of bundle.");
        console.log("    when skipped, output will be written to the console.");
        console.log();
        console.log("  --options.<name> <value>");
        console.log("    specify options as name-value pair(s) to customize the operation");
        console.log("      .normalize false|true");
        console.log("        use this option to normalize/sanitize the bundle for import ready.");
        console.log("      .excludeGoids");
        console.log("        use this option to exclude Goids from the bundled entities. This option is applicable only when normalize option is selected.");
    }
}

function reviseEntities(entities, mappings) {
    entities.forEach(entity => {
        if (entity.policy && entity.policy.xml) {
            reviseEntity(entity, mappings);
        }
    });
}

function reviseEntity(entity, mappings) {
    mappings.forEach(mapping => {
        entity.policy.xml = entity.policy.xml.replaceAll(mapping.source, function (match) {
            const name = butils.entityDisplayName(entity);
            utils.info(`  revising ${name}, replacing ${mapping.source} with ${mapping.target}`);
            return mapping.target;
        });
    });
}
