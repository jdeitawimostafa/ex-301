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



const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false } });

server.get('/test',(req,res) => {
  res.send('your server ready to use mostafa');
});

server.get('/',(req,res) => {
  res.render('home');
});

server.get('/getdata',(req,res) => {
  let greater = req.query.greater;
  let lower = req.query.less;
  let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline&price_greater_than=${greater}&price_less_than=${lower}`;

  superagent.get(url)
    .then(data => {
      let gettedData = data.body;
      let result = gettedData.map(items => {
        return new Maybelline (items);
      });
      res.render('ProductByPricepage',{dataArr:result});
    });
});

server.get('/getall',(req,res) => {
  let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline`;
  superagent.get(url)
    .then(data => {
      let gettedData = data.body;
      let result1 = gettedData.map(items => {
        return new Maybelline (items);
      });
      res.render('Allproducts',{allArr:result1});
    });
});

server.get('/database',(req,res) => {
  let {name,price,image_link,description} = req.query;
  let saveVal = [name,price,image_link,description];
  let sql = 'insert into maybedata (name,price,image_link,description) values ($1,$2,$3,$4)';
  client.query(sql,saveVal)
    .then( res.redirect('/getdatabase'));

});

server.get('/getdatabase',(req,res) => {
  let sql = 'select * from maybedata';
  client.query(sql)
    .then(data => {
      res.render('Myproducts',{productsArr:data.rows});
    });
});

server.get('/details/:id',(req,res) => {
  let saveVal = [req.params.id];
  let sql = 'select * from maybedata where id=$1';
  client.query(sql,saveVal)
    .then(data => {
      res.render('productsdetails',{detailsArr:data.rows[0]});
    });
});

server.put('/update/:id',(req,res) => {
  let {name,price,image_link,description} = req.body;
  let saveValues = [name,price,image_link,description,req.params.id];
  let sql = 'update maybedata set name=$1,price=$2,image_link=$3,description=$4 where id=$5';
  client.query(sql,saveValues)
    .then(
      res.redirect(`/details/${req.params.id}`));
});

server.delete('/delete/:id',(req,res) => {
  let sql = 'delete from maybedata where id=$1';
  let saveValues = [req.params.id];
  client.query(sql,saveValues)
    .then(res.redirect('/getdatabase'));
});



function Maybelline(key) {
  this.name = key.name;
  this.price = key.price;
  this.image_link = key.image_link;
  this.description = key.description;
}






client.connect()
  .then(() => {
    server.listen(PORT,()=>{
      console.log(`listening to port ${PORT}`);
    });
  });
