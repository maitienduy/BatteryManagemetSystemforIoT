const request = require('superagent');
var mysql = require('mysql');
const util = require('util');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ds2t1996",
    database: "test",
    multipleStatements: true
});
const query = util.promisify(connection.query).bind(connection);

connection.connect((err) => {
    if (!err)
        console.log("DB connection succeded");
    else
        console.log("DB connection failed \n Error" + JSON.stringify(err, undefined, 2))
});

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

var detail_device = []

module.exports = function (app, passport) {
    app.get('/', async function (req, res, next) {
      setTimeout(()=>{
      getData(req);
    }, 800)
      res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    app.get('/login', checkLoginForLoginPage, function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    app.get('/devices', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                // res.send(rows)
                res.render('user.ejs', {title: "RESTful Crud Example", data: rows});

            } else {
                console.log(err)
            }
        })
    });

    app.get('/devices/:id', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send(rows)
            } else {
                console.log(err)
            }
        })
    });

    app.delete('/devices_type/:device', isLoggedIn, function (req, res) {
        //console.log("delete", req.params.device)

        connection.query("DELETE FROM devices WHERE device = ?", [req.params.device], (err, rows) => {
            if (!err) {
                res.send("delete successfully")
            } else {
                console.log(err)
            }
        })
    });

    app.delete('/delete_device/:id', isLoggedIn, function (req, res) {
        // connection.query("SELECT * FROM devices WHERE device = ?", [req.body.username], (err, rows) => {
        //
        // })id
        //console.log("delesteid", req.params.id)

        connection.query("DELETE FROM devices WHERE id = ?", [req.params.id], (err, rows) => {
            if (!err) {
                res.send("delete successfully")
            } else {
                console.log(err)
            }
        })
    });

    app.post('/devices', isLoggedIn, function (req, res) {
        //get data
        var data = {
            device: req.body.device,
            time: req.body.time,
            prob: req.body.prob
        };

        //console.log("Datas", data)

    });

    app.post('/login', passport.authenticate('local-login', {
            successRedirect: '/item',
            failureRedirect: '/login',
            failureFlash: true
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect('/');
        });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    app.post('/signup', passport.authenticate('local-signup', {
        // successRedirect: '/detail_device',
        successRedirect: '/item',
        failureRedirect: '/signup',
        failureFlash: true
    }));


    //
    app.get('/dashboard', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices", (err, rows) => {
            if (!err) {
                // res.send(rows)
                //console.log("aaaa", rows[rows.length - 1])
                res.render('add_device.ejs', {
                    title: "RESTful Crud Example",
                    data: rows,
                    user: req.user
                });

            } else {
                console.log(err)
            }
        })


    });

    app.get('/detail', isLoggedIn, function (req, res) {
        connection.query("SELECT * FROM devices WHERE user = ?  ORDER BY id DESC ", [req.user.username], (err, rows) => {
            if (!err) {
                // res.send(rows)
                ////console.log("aaaa", rows[rows.length - 1], req.user)
                res.render('detail.ejs', {
                    title: "detail",
                    data: rows,
                    user: req.user,
                });

            } else {
                console.log(err)
            }
        })


    });

    app.get('/detail_device', isLoggedIn, async function (req, res) {
        try {
            let rows = await query('select * from devices where user = ? and device = ?', [detail_device[0], detail_device[1]]);
            //console.log("items", rows);
            res.render('detail_device.ejs', {
                title: "detail",
                data: rows,
                user: req.user,
            });

        } finally {
            // connection.end();
        }


    });


    app.post('/log', isLoggedIn, function (req, res) {
        detail_device = []
        detail_device = [req.user.username, req.body.device]
        //console.log("log", req.body.device)
        connection.query("SELECT * FROM devices WHERE user = ? AND device = ?", [req.user.username, req.body.device], (err, rows) => {
            if (!err) {
                // res.send(rows)

            } else {
                console.log(err)
            }
        })
        res.send("OK")

    });


    app.get('/item', isLoggedIn, async function (req, res) {
      //console.log(req.user)
        connection.query("SELECT device FROM devices WHERE user = ? and status = ?", [req.user.username, ''], async (err, rows) => {
            if (!err) {
                // res.send(rows)
                //console.log(rows)
                let rowsAll = []
                try {
                    for (let i = 0; i < rows.length; i++) {
                        let us = rows[i].device
                        let rows1 = await query('select * from devices where device = ?', [us]);
                        rowsAll.push(rows1[rows1.length - 1])
                    }
                    res.render('item.ejs', {
                        title: "detail",
                        data: rowsAll,
                        user: req.user,
                    });
                } finally {
                    // connection.end();
                }


            } else {
                console.log(err)
            }
        })
    });

    app.post('/dashboard', isLoggedIn, async function (req, res, next) {
        //console.log("req.bodsy", req.body)

        let defaultData = {
            device: req.body.device,
            time: '',
            user: req.body.username,
            voltage: '',
            prob: '',
            status: '',
            battery: '',
            battery_type: req.body.battery,
            date: getDate()
        };

        connection.query("SELECT * FROM devices WHERE device = ?", [req.body.device], (err, rowss) => {
            //console.log("rowss.length", rowss.length)
            if (rowss.length < 1 && req.body.device !== '' && req.body.battery !== '') {
                connection.query("INSERT INTO devices set ? ", defaultData, function (err, re) {

                    if (err) {
                        console.log(err);
                    } else {
                        console.log("POST OK!");

                    }
                });
                res.send("OK")
            } else if (req.body.device === '' || req.body.battery === '') {
                res.send("NOTHING")
            } else {
                res.send("ALREADY")
            }

            var data = {};
            setTimeout(()=>{
            getData(req);
          }, 800)
        })
        duplicateremove()
    });


    app.get('/logout', function (req, res) {
        req.logout();
        //console.log("req.isAuthenticated()", req.isAuthenticated())
        res.redirect('/');
    })
};

setTimeout(()=>{
checkStatusDevice();
}, 60000)
function checkStatusDevice() {
  duplicateremove();
  connection.query("SELECT device FROM devices WHERE status = ?", [''], async (err, rows) => {
      if (!err) {
        //console.log('checkRows', rows, rows.length)
          try {
              for (let i = 0; i < rows.length; i++) {
                //console.log('rowsiii', rows[i], rows[i].length)
                // if(rows[i].length >= 2){
                  let us = rows[i].device
                  //console.log('usdvice', us)
                  let rows1 = await query('select * from devices where device = ?', [us]);
                  //console.log('rows11', rows1)
                  if (rows1.length > 5) {
                  let ti1 = parseFloat(rows1[2].time) - parseFloat(rows1[1].time);
                  let ti2 = parseInt(rows1[rows1.length - 1].time) - parseInt(rows1[rows1.length - 2].time);
                  let ti3 = parseInt(rows1[rows1.length - 2].time) - parseInt(rows1[rows1.length - 3].time);
                  if(parseInt(ti2/1000) == parseInt(ti3/1000) && parseInt(ti1/1000) != parseInt(ti2/1000)) { ti1 = ti2}
                  console.log("intervaltime", ti1)
                  let tc1 = Date.parse(getDate()) - Date.parse(rows1[rows1.length - 1].date);
                  //console.log("lastwrite time", Date.parse(rows1[rows1.length - 1].date))
                  //console.log("current", Date.parse(getDate()))
                  console.log("servertime", tc1)
                  console.log("---------------------------")
                  if(tc1 > (ti1 + 15000)){
                    connection.query("UPDATE devices SET status='OFF' WHERE id = ?", [rows1[rows1.length - 1].id], function (err, rows, next) {
                        if (err) {
                            console.log(err);
                            return next("Mysql error, check your query");
                        } else {
                          //  console.log("update devices status OK!")
                        }
                    });
                  }
                // }
              }}
          } finally {
              // connection.end();
          }

      } else {
          console.log(err)
      }
  })
  setTimeout(()=>{
    checkStatusDevice();
  }, 60000)
}

function duplicateremove(){
connection.query("DELETE t2 FROM devices t1 INNER JOIN devices t2 WHERE t1.id < t2.id AND t1.time = t2.time AND t1.device = t2.device", function (err, rows, next) {})
console.log("removeduplicated")
}

async function getData(req) {
        req.connection.setTimeout( 1000 * 60 * 10 );
        await request.get('http://192.168.1.69:1880/ESP',600000).then((r) => {
                let battery_type = '';
                connection.query("SELECT * FROM devices WHERE device = ?", [r.body.device], (err, rows) => {
                    if (!err  && rows[rows.length - 1] !== undefined && rows[rows.length - 1].user == r.body.user && rows[rows.length - 1].device == r.body.device) {
                            if (parseInt(rows[rows.length - 1].time) !== parseInt(r.body.time)) {console.log("got new data")
                                connection.query("SELECT battery_type FROM devices WHERE device = ?", [r.body.device], (err, bat) => {
                                    if (bat.length > 0) {
                                        battery_type = bat[0].battery_type
                                        connection.query("SELECT * FROM battery WHERE battery_type = ?", [bat[0].battery_type], async (err, fPind) => {
                                            let pinV = '';
                                            power_s = 'no_info';
                                            estimate = 'no_info';
                                            if (req.body.battery === 'general') {
                                                pinV = 'no info';
                                            } else {
                                                if (r.body.voltage >= 4.18) {
                                                    pinV = 'full'
                                                } else if (parseFloat(r.body.voltage) < 4.18 && parseFloat(r.body.voltage) > 2.83 && fPind.length > 0) {
                                                    pinV = (parseFloat(fPind[0].battery_data) - (4.18 - parseFloat(r.body.voltage)) / 1.35 * (parseFloat(fPind[0].battery_data))).toString()
                                                }
                                                /*else if (parseFloat(r.body.voltage) < 4.15 && parseFloat(r.body.voltage) > 2.83 && fPind.length > 0) {
                                                    pinV = (parseFloat(fPind[0].battery_data) - (4.15 - parseFloat(r.body.voltage)) / 1.32 * (parseFloat(fPind[0].battery_data))).toString()
                                                } */
                                                 else {
                                                    pinV = 'no info'
                                                }
                                            }
                                                            let us = r.body.device
                                                            let rows1 = await query('select * from devices where device = ?', [us]);
                                                            if (rows1.length >= 5) {

                                                                let ti1 = parseInt(rows1[2].time) - parseInt(rows1[1].time);
                                                                let ti2 = parseInt(rows1[rows1.length - 1].time) - parseInt(rows1[rows1.length - 2].time);
                                                                let ti3 = parseInt(rows1[rows1.length - 2].time) - parseInt(rows1[rows1.length - 3].time);
                                                                if(parseInt(ti2/1000) == parseInt(ti3/1000) && parseInt(ti1/1000) != parseInt(ti2/1000)) { ti1 = ti2}
                                                                let pIndex = parseInt(3600000 / ti1)
                                                                if (rows1.length > (pIndex+10)){
                                                                    if (/*(rows1.length - 1) >= pIndex &&*/ ti1 < 3600000 /*&& rows1[rows1.length - 1 - pIndex].battery !== undefined && rows1[rows1.length - 1].battery !== undefined */) {
                                                                        let a = 0
                                                                        let b = 0
                                                                        for (i=1;i<11;i++){ a = a + parseInt(rows1[rows1.length - i].battery)
                                                                                            b = b + parseInt(rows1[rows1.length - i - pIndex].battery)
                                                                        }

                                                                        power_s = parseInt(parseInt(b-a)/10).toString()
                                                                        /*power_s = ((-1) * (rows1[rows1.length - 1].battery - rows1[rows1.length - 1 - pIndex].battery)).toString()*/
                                                                        estimate = (parseInt(parseInt(rows1[rows1.length - 1].battery) / parseInt(power_s))).toString()
                                                                        connection.query("UPDATE devices SET estimate_time = ?, power_consumption=? WHERE time = ?", [estimate, power_s, rows1[rows1.length - 1].time], function (err, rows, next) {
                                                                        //console.log("calculated")
                                                                            if (err) {
                                                                                console.log(err);
                                                                            }
                                                                        })
                                                                    } else if (ti1 > 3600000) {
                                                                        power_s = ((-1) * (rows1[rows1.length - 1].battery - rows1[rows1.length - 2].battery) * 3600000 / ti1).toString()
                                                                        estimate = (parseInt(parseInt(rows1[rows1.length - 1].battery) / parseInt(power_s))).toString()
                                                                        connection.query("UPDATE devices SET estimate_time = ?, power_consumption=? WHERE time = ?", [estimate, power_s, rows1[rows1.length - 1].time], function (err, rows, next) {
                                                                        //console.log("calculated")
                                                                            if (err) {
                                                                                console.log(err);
                                                                            } else {
                                                                            }
                                                                        })
                                                                    } else {
                                                                        power_s = 'no_info';
                                                                        estimate = 'no_info';
                                                                    }
                                                              }
                                                            }

                                            data = []
                                            data = {
                                                device: r.body.device,
                                                time: r.body.time,
                                                user: r.body.user,
                                                voltage: r.body.voltage,
                                                prob: r.body.prob,
                                                status: "ON",
                                                battery: (parseInt(pinV)).toString(),
                                                power_consumption: power_s,
                                                estimate_time: estimate,
                                                battery_type: battery_type,
                                                date: getDate(),
                                            }
                                            connection.query("INSERT INTO devices set ? ", data, function (err, re) {});
                                        })
                                    }
                                })
                            } else {
                            }
                    }

                    else {
                        //console.log(err)
                    }
                });
              }).catch(err => {
                  console.log(err);
              });
              setTimeout(()=>{
              getData(req);
            }, 800)
}

function checkLoginForLoginPage(req, res, next) {
    //console.log("req.isAuthenticated()", req.isAuthenticated())
    if (req.isAuthenticated() === true) {
        res.redirect('/item')
    } else {
        return next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

function getDate() {
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return date + ' ' + time

}
