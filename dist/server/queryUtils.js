"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const BZ_BASE_URI = "https://bugzilla.mozilla.org/rest/bug";
// IN PROGRESS
function _checkGroupOperator(o) {
    if (!["OR", "AND"].includes(o)) {
        throw new Error(`${o} is not a valid group operator. Your choices are: OR, AND`);
    }
}
const GROUP_OPEN_VALUE = "OP";
const GROUP_CLOSE_VALUE = "CP";
function _addRuleSet(config, resultQs, currentIndex = 1) {
    const isTopLevel = currentIndex === 1;
    // Special case for the first group
    if (isTopLevel && !Array.isArray(config) && config.rules && config.operator) {
        _checkGroupOperator(config.operator);
        resultQs.j_top = config.operator;
        return _addRuleSet(config.rules, resultQs, currentIndex);
    }
    // group definition
    let rules;
    if (Array.isArray(config))
        rules = config;
    else if (Array.isArray(config.rules))
        rules = config.rules;
    if (rules) {
        // OPENING
        if (!isTopLevel) {
            resultQs[`f${currentIndex}`] = GROUP_OPEN_VALUE;
            if (!Array.isArray(config) && config.operator) {
                _checkGroupOperator(config.operator);
                resultQs[`j${currentIndex}`] = config.operator;
            }
            currentIndex++;
        }
        for (const rule of rules) {
            currentIndex = _addRuleSet(rule, resultQs, currentIndex);
        }
        // ENDING
        if (!isTopLevel) {
            resultQs[`f${currentIndex}`] = GROUP_CLOSE_VALUE;
        }
        return currentIndex + 1;
    }
    // rule definition
    else if (!Array.isArray(config)) {
        resultQs[`f${currentIndex}`] = config.key;
        resultQs[`o${currentIndex}`] = config.operator || "equals";
        resultQs[`v${currentIndex}`] = config.value;
        return currentIndex + 1;
    }
    return currentIndex;
}
function addRuleSet(config) {
    const result = { query_format: "advanced" };
    _addRuleSet(config, result);
    return result;
}
exports.addRuleSet = addRuleSet;
function _addCustom(key, value, fIndex) {
    let i = fIndex + 1;
    const qs = {};
    if (value instanceof Array) {
        qs[`f${i}`] = key;
        qs[`o${i}`] = "anywordssubstr";
        qs[`v${i}`] = value.join(",");
        i++;
    }
    else if (typeof value === "object") {
        for (const operation in value) {
            qs[`f${i}`] = key;
            qs[`o${i}`] = operation;
            if (value[operation] instanceof Array) {
                qs[`v${i}`] = value[operation].join(",");
            }
            else {
                qs[`v${i}`] = value[operation];
            }
            i++;
        }
    }
    else {
        qs[`f${i}`] = key;
        qs[`o${i}`] = "substring";
        qs[`v${i}`] = value;
        i++;
    }
    return { result: qs, index: i - 1 };
}
// Converts a configuration to a query string understood by Bugzilla
function configToQuery(config) {
    const qs = {};
    let fIndex = 0;
    function addCustom(key, value) {
        const { result, index } = _addCustom(key, value, fIndex);
        fIndex = index;
        return result;
    }
    if (config.rules && config.custom) {
        throw new Error("You can't use both .custom and .rules; choose one or the other.");
    }
    for (const key in config) {
        switch (key) {
            case "include_fields":
                qs.include_fields = config.include_fields.join(",");
                break;
            case "iteration":
                Object.assign(qs, addCustom("cf_fx_iteration", config.iteration));
                break;
            case "custom":
                for (const k in config.custom) {
                    Object.assign(qs, addCustom(k, config.custom[k]));
                }
                break;
            case "rules":
                Object.assign(qs, addRuleSet(config.rules));
                break;
            default:
                qs[key] = config[key];
        }
    }
    if (!qs.include_fields) {
        qs.include_fields = [
            "id",
            "summary",
            "status",
            "assigned_to",
            "blocks",
            "priority",
            "",
        ];
    }
    return qs;
}
exports.configToQuery = configToQuery;
// Fetches bugs from bugzilla given a query string
async function fetchBugsFromBugzilla(qs) {
    return new Promise((resolve, reject) => {
        try {
            request({
                uri: BZ_BASE_URI,
                method: "GET",
                qs,
                qsStringifyOptions: { arrayFormat: "repeat" },
            }, (error, resp, body) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                let parsed = { bugs: [] };
                try {
                    parsed = JSON.parse(body);
                }
                catch (e) {
                    console.log(body, qs);
                    console.error(e);
                }
                const uri = resp.request.uri.href;
                resolve({ uri, bugs: parsed.bugs });
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
exports.fetchBugsFromBugzilla = fetchBugsFromBugzilla;
async function fetchQuery(query) {
    const qs = configToQuery(query);
    const { uri, bugs } = (await fetchBugsFromBugzilla(qs)) || [];
    return {
        uri,
        query,
        bugs,
    };
}
exports.fetchQuery = fetchQuery;
