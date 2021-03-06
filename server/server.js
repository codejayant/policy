require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {mongoose} = require('./db/mongoose');
const {Policy} = require('./models/policy');
const {dateDiffInDays} = require('./utility/DateUtils');

const app = express();
const port = process.env.PORT;

let allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' === req.method) {
        res.send(200);
    }
    else {
        next();
    }
};

app.use(allowCrossDomain);
app.use(bodyParser.json());

const baseUrl = '/order/returnOrder/returnable';

app.post(`${baseUrl}/policies`, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let policy = new Policy(req.body);

    policy.save().then((doc) => {
        res.status(201).send(doc);
    }, (err) => {
        res.status(400).send(err);
    });
});

app.get(`${baseUrl}/policies`, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    Policy.find().then((policies) => {
        res.send({policies});
    }, (e) => {
        res.status(400).send(e);
    });
});

app.get(`${baseUrl}/policies/nameplate/:name/deptNbr/:deptId`, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let nameplate = req.params.name;
    let deptNbr = req.params.deptId;

    let searchableQuery = {nameplate, deptNbr};

    console.log("query : ", searchableQuery);

    Policy.find(searchableQuery).then((policies) => {
        console.log('policies : ', policies);
        if (!policies) {
            return res.status(404).send();
        }
        res.send({policies});
    }, (err) => {
        res.status(400).send(err);
    });
});

app.put(`${baseUrl}/policies`, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let policy = new Policy(req.body);

    let nameplate = policy.nameplate;
    let deptNbr = policy.deptNbr;

    let searchableQuery = {nameplate, deptNbr};
    console.log("query : ", searchableQuery);

    Policy.find(searchableQuery).then((existingPolicy) => {
        console.log('existing Policy ', existingPolicy);

        // if existingPolicy is not found throw 404
        if (typeof existingPolicy[0] === 'undefined') {
            console.log("existing policy not found");
            return res.status(404).send();
        } else {
            policy._id = existingPolicy[0]._id;
            console.log("object id : ", policy._id);

            Policy.findByIdAndUpdate(policy._id, {$set: policy}, {new: true}).then((updatedPolicy) => {
                if (!updatedPolicy) {
                    console.log("error in policy update");
                    res.status(400).send();
                }
                res.send(updatedPolicy);
            }).catch((e) => {
                console.error("error in update : ", e);
                res.status(400).send();
            });
        }
    });
});

app.post(`${baseUrl}/applyPolicies`, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    console.log("================================================");
    console.log("POLICY .........................................");


    let orderdata = req.body;
    console.debug("request : ", orderdata);

    let lineItemsList = orderdata.lineItemsList;

    let arrayToOutput = [];

    let itemlistPromise = lineItemsList.map((ele) => {
        let deptNbr = ele.dept;
        let searchableQuery = {deptNbr};

        return Policy.find(searchableQuery).then((policy) => {

            let remarks;
            let policyPeriod;

            // if existingPolicy is not found set default policy rule
            if (typeof policy[0] === 'undefined') {
                console.log("existing policy not found. Using Default Policy");
                policyPeriod = 30;
                remarks = `using default policy period of ${policyPeriod} Days`;
            } else {
                console.log('-----------------', policy);
                remarks = policy[0].policyDescription;
                policyPeriod = policy[0].policyPeriod;
            }

            ele.returnable = policyPeriod > dateDiffInDays(new Date(), new Date(ele.deliveryDate));
            ele.remarks = remarks;

            arrayToOutput.push(ele);
            return arrayToOutput;
        });
    });

    Promise.all(itemlistPromise).then((result) => {
        console.debug("===================== \n", result);
        orderdata.lineItemsList = result[0]; // dirty hack : result should not have two entry which it does right now. Need to improve later.

        res.send(orderdata);
    });

});

app.listen(port, () => {
    console.log('Started on port ', port);
});

module.exports = {app};