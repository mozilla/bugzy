"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITERATION_LOOKUP = { "byDate": { "2018-01-15": "60.1", "2018-01-22": "60.1", "2018-01-29": "60.2", "2018-02-05": "60.2", "2018-02-12": "60.3", "2018-02-19": "60.3", "2018-02-26": "60.4", "2018-03-05": "60.4", "2018-03-12": "61.1", "2018-03-19": "61.1", "2018-03-26": "61.2", "2018-04-02": "61.2", "2018-04-09": "61.3", "2018-04-16": "61.3", "2018-04-23": "61.4", "2018-04-30": "61.4", "2018-05-07": "62.1", "2018-05-14": "62.1", "2018-05-21": "62.2", "2018-05-28": "62.2", "2018-06-04": "62.3", "2018-06-11": "62.3", "2018-06-18": "62.4", "2018-06-25": "63.1", "2018-07-02": "63.1", "2018-07-09": "63.2", "2018-07-16": "63.2", "2018-07-23": "63.3", "2018-07-30": "63.3", "2018-08-06": "63.4", "2018-08-13": "63.4", "2018-08-20": "63.5", "2018-08-27": "63.5", "2018-09-03": "64.1", "2018-09-10": "64.1", "2018-09-17": "64.2", "2018-09-24": "64.2", "2018-10-01": "64.3", "2018-10-08": "64.3", "2018-10-15": "64.3", "2018-10-22": "65.1", "2018-10-29": "65.1", "2018-11-05": "65.2", "2018-11-12": "65.2", "2018-11-19": "65.3", "2018-11-26": "65.3", "2018-12-03": "65.4", "2018-12-10": "66.1", "2018-12-17": "66.1", "2018-12-24": "66.2", "2018-12-31": "66.2", "2019-01-07": "66.3", "2019-01-14": "66.3", "2019-01-21": "66.4", "2019-01-28": "67.1", "2019-02-04": "67.1", "2019-02-11": "67.2", "2019-02-18": "67.2", "2019-02-25": "67.3", "2019-03-04": "67.3", "2019-03-11": "67.4", "2019-03-18": "68.1", "2019-03-25": "68.1", "2019-04-01": "68.2", "2019-04-08": "68.2", "2019-04-15": "68.3", "2019-04-22": "68.3", "2019-04-29": "68.4", "2019-05-06": "68.4", "2019-05-13": "68.4", "2019-05-20": "69.1", "2019-05-27": "69.2", "2019-06-03": "69.2", "2019-06-10": "69.3", "2019-06-17": "69.3", "2019-06-24": "69.4", "2019-07-01": "69.4", "2019-07-08": "70.1", "2019-07-15": "70.1", "2019-07-22": "70.2", "2019-07-29": "70.2", "2019-08-05": "70.3", "2019-08-12": "70.3", "2019-08-19": "70.4", "2019-08-26": "70.4", "2019-09-02": "71.1", "2019-09-09": "71.1", "2019-09-16": "71.2", "2019-09-23": "71.2", "2019-09-30": "71.3", "2019-10-07": "71.3", "2019-10-14": "71.4", "2019-10-21": "71.4", "2019-10-28": "72.1", "2019-11-04": "72.1", "2019-11-11": "72.2", "2019-11-18": "72.2", "2019-11-25": "72.3", "2019-12-02": "72.3", "2019-12-09": "72.4", "2019-12-16": "72.4", "2019-12-23": "73.1", "2019-12-30": "73.1", "2020-01-06": "73.2", "2020-01-13": "73.2", "2020-01-20": "73.3", "2020-01-27": "73.3", "2020-02-03": "73.4", "2020-02-10": "73.4", "2020-02-17": "74.1", "2020-02-24": "74.1", "2020-03-02": "74.2", "2020-03-09": "74.2", "2020-03-16": "74.3", "2020-03-23": "74.3", "2020-03-30": "74.4", "2020-04-06": "74.4", "2020-04-13": "75.1", "2020-04-20": "75.1", "2020-04-27": "75.2", "2020-05-04": "75.2", "2020-05-11": "75.3", "2020-05-18": "75.3", "2020-05-25": "75.4", "2020-06-01": "75.4", "2020-06-08": "76.1", "2020-06-15": "76.1", "2020-06-22": "76.2", "2020-06-29": "76.2", "2020-07-06": "76.3", "2020-07-13": "76.3", "2020-07-20": "76.4", "2020-07-27": "76.4", "2020-08-03": "77.1", "2020-08-10": "77.1", "2020-08-17": "77.2", "2020-08-24": "77.2", "2020-08-31": "77.3", "2020-09-07": "77.3", "2020-09-14": "77.4", "2020-09-21": "77.4", "2020-09-28": "78.1", "2020-10-05": "78.1", "2020-10-12": "78.2", "2020-10-19": "78.2", "2020-10-26": "78.3", "2020-11-02": "78.3", "2020-11-09": "78.4", "2020-11-16": "78.4", "2020-11-23": "79.1", "2020-11-30": "79.1", "2020-12-07": "79.2", "2020-12-14": "79.2", "2020-12-21": "79.3", "2020-12-28": "79.3", "2021-01-04": "79.4", "2021-01-11": "79.4", "2021-01-18": "80.1", "2021-01-25": "80.1", "2021-02-01": "80.2", "2021-02-08": "80.2", "2021-02-15": "80.3", "2021-02-22": "80.3", "2021-03-01": "80.4", "2021-03-08": "80.4" }, "byVersionString": { "60.1": { "startDate": "2018-01-15T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-01-28T00:00:00.000-05:00" }, "60.2": { "startDate": "2018-01-29T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-02-11T00:00:00.000-05:00" }, "60.3": { "startDate": "2018-02-12T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-02-25T00:00:00.000-05:00" }, "60.4": { "startDate": "2018-02-26T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-03-11T00:00:00.000-05:00" }, "61.1": { "startDate": "2018-03-12T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-03-25T00:00:00.000-04:00" }, "61.2": { "startDate": "2018-03-26T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-04-08T00:00:00.000-04:00" }, "61.3": { "startDate": "2018-04-09T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-04-22T00:00:00.000-04:00" }, "61.4": { "startDate": "2018-04-23T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-05-06T00:00:00.000-04:00" }, "62.1": { "startDate": "2018-05-07T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-05-20T00:00:00.000-04:00" }, "62.2": { "startDate": "2018-05-21T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-06-03T00:00:00.000-04:00" }, "62.3": { "startDate": "2018-06-04T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-06-17T00:00:00.000-04:00" }, "62.4": { "startDate": "2018-06-18T00:00:00.000-04:00", "weeks": 1, "endDate": "2018-06-24T00:00:00.000-04:00" }, "63.1": { "startDate": "2018-06-25T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-07-08T00:00:00.000-04:00" }, "63.2": { "startDate": "2018-07-09T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-07-22T00:00:00.000-04:00" }, "63.3": { "startDate": "2018-07-23T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-08-05T00:00:00.000-04:00" }, "63.4": { "startDate": "2018-08-06T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-08-19T00:00:00.000-04:00" }, "63.5": { "startDate": "2018-08-20T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-09-02T00:00:00.000-04:00" }, "64.1": { "startDate": "2018-09-03T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-09-16T00:00:00.000-04:00" }, "64.2": { "startDate": "2018-09-17T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-09-30T00:00:00.000-04:00" }, "64.3": { "startDate": "2018-10-01T00:00:00.000-04:00", "weeks": 3, "endDate": "2018-10-21T00:00:00.000-04:00" }, "65.1": { "startDate": "2018-10-22T00:00:00.000-04:00", "weeks": 2, "endDate": "2018-11-04T00:00:00.000-04:00" }, "65.2": { "startDate": "2018-11-05T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-11-18T00:00:00.000-05:00" }, "65.3": { "startDate": "2018-11-19T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-12-02T00:00:00.000-05:00" }, "65.4": { "startDate": "2018-12-03T00:00:00.000-05:00", "weeks": 1, "endDate": "2018-12-09T00:00:00.000-05:00" }, "66.1": { "startDate": "2018-12-10T00:00:00.000-05:00", "weeks": 2, "endDate": "2018-12-23T00:00:00.000-05:00" }, "66.2": { "startDate": "2018-12-24T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-01-06T00:00:00.000-05:00" }, "66.3": { "startDate": "2019-01-07T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-01-20T00:00:00.000-05:00" }, "66.4": { "startDate": "2019-01-21T00:00:00.000-05:00", "weeks": 1, "endDate": "2019-01-27T00:00:00.000-05:00" }, "67.1": { "startDate": "2019-01-28T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-02-10T00:00:00.000-05:00" }, "67.2": { "startDate": "2019-02-11T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-02-24T00:00:00.000-05:00" }, "67.3": { "startDate": "2019-02-25T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-03-10T00:00:00.000-05:00" }, "67.4": { "startDate": "2019-03-11T00:00:00.000-04:00", "weeks": 1, "endDate": "2019-03-17T00:00:00.000-04:00" }, "68.1": { "startDate": "2019-03-18T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-03-31T00:00:00.000-04:00" }, "68.2": { "startDate": "2019-04-01T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-04-14T00:00:00.000-04:00" }, "68.3": { "startDate": "2019-04-15T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-04-28T00:00:00.000-04:00" }, "68.4": { "startDate": "2019-04-29T00:00:00.000-04:00", "weeks": 3, "endDate": "2019-05-19T00:00:00.000-04:00" }, "69.1": { "startDate": "2019-05-20T00:00:00.000-04:00", "weeks": 1, "endDate": "2019-05-26T00:00:00.000-04:00" }, "69.2": { "startDate": "2019-05-27T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-06-09T00:00:00.000-04:00" }, "69.3": { "startDate": "2019-06-10T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-06-23T00:00:00.000-04:00" }, "69.4": { "startDate": "2019-06-24T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-07-07T00:00:00.000-04:00" }, "70.1": { "startDate": "2019-07-08T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-07-21T00:00:00.000-04:00" }, "70.2": { "startDate": "2019-07-22T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-08-04T00:00:00.000-04:00" }, "70.3": { "startDate": "2019-08-05T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-08-18T00:00:00.000-04:00" }, "70.4": { "startDate": "2019-08-19T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-09-01T00:00:00.000-04:00" }, "71.1": { "startDate": "2019-09-02T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-09-15T00:00:00.000-04:00" }, "71.2": { "startDate": "2019-09-16T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-09-29T00:00:00.000-04:00" }, "71.3": { "startDate": "2019-09-30T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-10-13T00:00:00.000-04:00" }, "71.4": { "startDate": "2019-10-14T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-10-27T00:00:00.000-04:00" }, "72.1": { "startDate": "2019-10-28T00:00:00.000-04:00", "weeks": 2, "endDate": "2019-11-10T00:00:00.000-05:00" }, "72.2": { "startDate": "2019-11-11T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-11-24T00:00:00.000-05:00" }, "72.3": { "startDate": "2019-11-25T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-12-08T00:00:00.000-05:00" }, "72.4": { "startDate": "2019-12-09T00:00:00.000-05:00", "weeks": 2, "endDate": "2019-12-22T00:00:00.000-05:00" }, "73.1": { "startDate": "2019-12-23T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-01-05T00:00:00.000-05:00" }, "73.2": { "startDate": "2020-01-06T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-01-19T00:00:00.000-05:00" }, "73.3": { "startDate": "2020-01-20T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-02-02T00:00:00.000-05:00" }, "73.4": { "startDate": "2020-02-03T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-02-16T00:00:00.000-05:00" }, "74.1": { "startDate": "2020-02-17T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-03-01T00:00:00.000-05:00" }, "74.2": { "startDate": "2020-03-02T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-03-15T00:00:00.000-04:00" }, "74.3": { "startDate": "2020-03-16T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-03-29T00:00:00.000-04:00" }, "74.4": { "startDate": "2020-03-30T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-04-12T00:00:00.000-04:00" }, "75.1": { "startDate": "2020-04-13T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-04-26T00:00:00.000-04:00" }, "75.2": { "startDate": "2020-04-27T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-05-10T00:00:00.000-04:00" }, "75.3": { "startDate": "2020-05-11T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-05-24T00:00:00.000-04:00" }, "75.4": { "startDate": "2020-05-25T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-06-07T00:00:00.000-04:00" }, "76.1": { "startDate": "2020-06-08T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-06-21T00:00:00.000-04:00" }, "76.2": { "startDate": "2020-06-22T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-07-05T00:00:00.000-04:00" }, "76.3": { "startDate": "2020-07-06T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-07-19T00:00:00.000-04:00" }, "76.4": { "startDate": "2020-07-20T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-08-02T00:00:00.000-04:00" }, "77.1": { "startDate": "2020-08-03T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-08-16T00:00:00.000-04:00" }, "77.2": { "startDate": "2020-08-17T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-08-30T00:00:00.000-04:00" }, "77.3": { "startDate": "2020-08-31T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-09-13T00:00:00.000-04:00" }, "77.4": { "startDate": "2020-09-14T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-09-27T00:00:00.000-04:00" }, "78.1": { "startDate": "2020-09-28T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-10-11T00:00:00.000-04:00" }, "78.2": { "startDate": "2020-10-12T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-10-25T00:00:00.000-04:00" }, "78.3": { "startDate": "2020-10-26T00:00:00.000-04:00", "weeks": 2, "endDate": "2020-11-08T00:00:00.000-05:00" }, "78.4": { "startDate": "2020-11-09T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-11-22T00:00:00.000-05:00" }, "79.1": { "startDate": "2020-11-23T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-12-06T00:00:00.000-05:00" }, "79.2": { "startDate": "2020-12-07T00:00:00.000-05:00", "weeks": 2, "endDate": "2020-12-20T00:00:00.000-05:00" }, "79.3": { "startDate": "2020-12-21T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-01-03T00:00:00.000-05:00" }, "79.4": { "startDate": "2021-01-04T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-01-17T00:00:00.000-05:00" }, "80.1": { "startDate": "2021-01-18T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-01-31T00:00:00.000-05:00" }, "80.2": { "startDate": "2021-02-01T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-02-14T00:00:00.000-05:00" }, "80.3": { "startDate": "2021-02-15T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-02-28T00:00:00.000-05:00" }, "80.4": { "startDate": "2021-03-01T00:00:00.000-05:00", "weeks": 2, "endDate": "2021-03-14T00:00:00.000-05:00" } }, "orderedVersionStrings": ["60.1", "60.2", "60.3", "60.4", "61.1", "61.2", "61.3", "61.4", "62.1", "62.2", "62.3", "62.4", "63.1", "63.2", "63.3", "63.4", "63.5", "64.1", "64.2", "64.3", "65.1", "65.2", "65.3", "65.4", "66.1", "66.2", "66.3", "66.4", "67.1", "67.2", "67.3", "67.4", "68.1", "68.2", "68.3", "68.4", "69.1", "69.2", "69.3", "69.4", "70.1", "70.2", "70.3", "70.4", "71.1", "71.2", "71.3", "71.4", "72.1", "72.2", "72.3", "72.4", "73.1", "73.2", "73.3", "73.4", "74.1", "74.2", "74.3", "74.4", "75.1", "75.2", "75.3", "75.4", "76.1", "76.2", "76.3", "76.4", "77.1", "77.2", "77.3", "77.4", "78.1", "78.2", "78.3", "78.4", "79.1", "79.2", "79.3", "79.4", "80.1", "80.2", "80.3", "80.4"] };
