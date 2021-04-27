'use strict';

const dotenv = require('dotenv').config();

const express = require('express');

const server = express();

const cors = require ('cors');

const pg = require('pg');

const methodOverride = require('method-override');

const superagent = require ('superagent');

const PORT = process.env.PORT || 4000;

server.use(cors());

server.use(express.urlencoded({ extended: true }));

server.use(methodOverride('_method'));

server.use(express.static('./public'));

server.set('view engine', 'ejs');



const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false } }); 

server.get('/test',(req,res) => {
    res.send('your server ready to use mostafa 2');
});

server.get('/',(req,res) => {
    let covidUrl = `https://api.covid19api.com/world/total`;
    superagent.get(covidUrl)
    .then(items => {

        let gettedData = items.body;
        // return new Covid (gettedData);
        res.render('home',{itemsArr:gettedData})
    }); 
});

server.get('/getresult',(req,res) => {
    let countryName = req.query.country;
    let from = req.query.from;
    let to = req.query.to;
    let countryurl = `https://api.covid19api.com/country/${countryName}/status/confirmed?from=${from}&to=${to}`;

    superagent.get(countryurl)
    .then(data => {

        let gettedData = data.body;
        console.log('country', gettedData);
        let result = gettedData.map(items => {
            return new Country (items);
         
        });
        console.log('mostafa',result);
        res.render('getCountryResult',{countryArr:result});
    });
});

function Country(data) {
    this.cases = data.Cases;
    this.date = data.Date;
}

server.get('/allcountries',(req,res) => {
    let allurl = `https://api.covid19api.com/summary`;

    superagent.get(allurl)
    .then(data => {
        let gettedData1 = data.body.Countries;
        console.log('country', gettedData1);
        let result1 = gettedData1.map(items => {
            return new  All (items);
    });
    res.render('AllCountries',{allArr:result1});
});
});


function All(alldata) {
    this.country = alldata.Country;
    this.totalconfirmed = alldata.TotalConfirmed;
    this.totaldeaths = alldata.TotalDeaths;
    this.totalrecovered = alldata.TotalRecovered;
    this.date = alldata.Date;
}

server.get('/database',(req,res) => {
    let {country,totalconfirmed,totaldeaths,totalrecovered,Date} = req.query;
    let saveVal = [country,totalconfirmed,totaldeaths,totalrecovered,Date]
    let sql = 'insert into coviddata (country,totalconfirmed,totaldeaths,totalrecovered,Date) values ($1,$2,$3,$4,$5) returning *';
    client.query(sql,saveVal)
    .then( res.redirect('/getdata'));
});

server.get('/getdata',(req,res) => {
    let sql = 'select * from coviddata';
    client.query(sql)
    .then(data => {
        res.render('Myrecords',{recordsArr:data.rows})
    });
});

server.get('/getdetails/:id',(req,res) => {
    let saveVal = [req.params.id];
    let sql = 'select * from coviddata where id=$1';
    client.query(sql,saveVal)
    .then(items => {
        res.render('RecordDetails',{detailsArr:items.rows[0]});
    }); 
});

server.put('/update/:id',(req,res) => {
    let sql = 'update coviddata set country=$1,totalconfirmed=$2,totaldeaths=$3,totalrecovered=$4,date=$5 where id=$6';
    let {country,totalconfirmed,totaldeaths,totalrecovered,date} = req.body;
    let saveVal = [country,totalconfirmed,totaldeaths,totalrecovered,date,req.params.id]
    client.query(sql,saveVal)
    .then(res.redirect(`/getdetails/${req.params.id}`));
});

server.delete('/delete/:id',(req,res) => {
    let saveVal = [req.params.id]
    let sql = 'delete from coviddata where id=$1'
    client.query(sql,saveVal)
    .then(res.redirect('/getdata'));
});





client.connect()
  .then(() => {
    server.listen(PORT,()=>{
      console.log(`listening to port ${PORT}`);
    });
 });
