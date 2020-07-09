const functions = require('firebase-functions');
const admin = require('firebase-admin')
const FirebaseAuth = require('firebaseauth');
const config = require('./config');
const bodyParser = require('body-parser');
const firebase = new FirebaseAuth(config.apikey);
var serviceAccount = require("./service_account.json");
const moment = require('moment-timezone');

const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors({ origin: true }));
app.use(bodyParser.json())

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://verification-classrooms.firebaseio.com"
});
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const db = admin.database();


const professor_permission = (req, res, next) => {
  if (req.headers.token === undefined) {
    return res.status(401).json({ message: "Please insert token" })
  }
  else {
    const token = req.headers.token
    let id;
    admin.auth().verifyIdToken(token).then(async claim => {
      if (claim.professor === true) {
        req.uid = claim.user_id;
        const resp = await db.ref('User').child(claim.user_id).once('value')
        let id = resp.val().uId
        req.id = id;
        next()
      }
      else {
        return res.status(403).json({ message: "You don't have permission" })
      }
    })
      .catch(err => {
        return res.status(500).json({
          message: "Error: " + err.message
        })
      })
  }
}

const nisit_permission = (req, res, next) => {
  if (req.headers.token === undefined) {
    return res.status(401).json({ message: "Please insert token" })
  }
  else {
    const token = req.headers.token
    let id;
    admin.auth().verifyIdToken(token).then(async claim => {
      if (claim.nisit === true) {
        req.uid = claim.user_id;
        const resp = await db.ref('User').child(claim.user_id).once('value')
        let id = resp.val().uId
        req.id = id;
        next()
      }
      else {
        return res.status(403).json({ message: "You don't have permission" })
      }
    })
      .catch(err => {
        return res.status(500).json({
          message: "Error: " + err.message
        })
      })
  }
}


app.get('/getClass', async (req, res) => {
  const classes = []

})
// app.get('/getScannerID',professor_permission ,async (req,res) => { 
//   const scanner = []
//   const scanner_db = db.ref('/Scanner')
//   const snapshot_scanner = await scanner_db.once('value')
//   let p = [];
//   snapshot_scanner.forEach(doc => {
//     if()
//   })


// })
app.get('/getSectionData/:id', professor_permission, async (req, res) => {
  let section_id = req.params.id;
  let sec = [];
  await db.ref('/Section').child(section_id).once('value')
    .then(section => {
      sec.push({
        id: section.key,
        room: section.val().room,
        sId: section.val().sId,
        scId: section.val().scId,
        sectionNumber: section.val().sectionNumber,
        subject: section.val().subject,
        timetable: section.val().timetable
      })
      return sec;
    })
    .then(async () => {
      const regis = [];
      await db.ref('Regis').once('value')
        .then(registrations => {
          registrations.forEach(registration => {
            if (registration.val().sId === section_id) {
              regis.push({
                sId: registration.val().sId,
                uId: registration.val().uId
              })
            }
          })
        })
      return regis;
    })
    .then(async (regis_data) => {
      const user = [];
      await db.ref('/User').once('value')
        .then(users => {
          regis_data.forEach(row_data => {
            users.forEach(row_user => {
              if (row_user.val().uId === row_data.uId) {
                user.push({
                  id: row_user.key,
                  uId: row_user.val().uId,
                  name: row_user.val().name,
                  surname: row_user.val().surname
                })
              }
            })
          })
          sec[0].student = user
          return res.status(200).json({
            message: "Get Data Success",
            data: sec,
          })
        })
    })
})

app.get('/getScannerByTeacher', professor_permission, async (req, res) => {

  let id = req.id;

  const scanner_teacher = [];

  const un_scanner = [];

  await db.ref('/Scanner').once('value')
    .then(scanners => {
      scanners.forEach(scanner => {
        if (scanner.val().uId === id) {
          scanner_teacher.push({
            id: scanner.key,
            scId: scanner.val().scId,
            uId: scanner.val().uId
          })
        }
        else if (scanner.val().uId === '') {
          un_scanner.push({
            id: scanner.key,
            scId: scanner.val().scId,
            uId: scanner.val().uId
          })
        }
      })
    })

  console.log(un_scanner)
  const result = scanner_teacher.concat(un_scanner)

  return res.status(200).json({
    message: "Get Success",
    data: result
  })

})


app.get('/getSection', professor_permission, async (req, res) => {
  try {
    let section = [];
    const sections = await db.ref('/Section').once('value');

    sections.forEach(d => {
      section.push({
        id: d.key,
        subject: d.val().subject,
        sId: d.val().sId,
        sectionNumber: d.val().sectionNumber,
        scId: d.val().scId,
        uId: d.val().uId,
        room: d.val().room,
        timelate:d.val().timelate,
        timetable: d.val().timetable
      })
    })

    console.log(section)
    console.log(req.id)
    let arr = [];
    for (let i = 0; i < section.length; i++) {
      if (section[i].uId === req.id) {
        if (section[i].scId !== "" && section[i].scId !== null) {
          arr.push({
            id: section[i].id,
            subject: section[i].subject,
            sId: section[i].sId,
            sectionNumber: section[i].sectionNumber,
            scId: section[i].scId,
            uId: section[i].uId,
            room: section[i].room,
            timelate: section[i].timelate,
            timetable: section[i].timetable
          })
        }
        else {
          arr.push({
            id: section[i].id,
            subject: section[i].subject,
            sId: section[i].sId,
            sectionNumber: section[i].sectionNumber,
            scId: "เชื่อม",
            uId: section[i].uId,
            room: section[i].room,
            timelate: section[i].timelate,
            timetable: section[i].timetable
          })
        }
      }
    }

    return res.status(200).json({
      message: "Get Success",
      data: arr
    })
  }
  catch (err) {
    return res.status(500).json({
      message: err.message
    })
  }
})


app.get('/getScanner', async (req, res) => {
  const scanner = []
  const scanner_db = db.ref('/Scanner')
  const snapshot_scanner = await scanner_db.once('value')
  let p = [];
  snapshot_scanner.forEach(doc => {
    if (doc.val().uId === '') {
      p.push({
        id: doc.key,
        scId: doc.val().scId,
        uId: '-',
        name: '-',
        surname: ''
      })
    }
    else {
      scanner.push({
        id: doc.key,
        scId: doc.val().scId,
        uId: doc.val().uId,
        status: doc.val().status,
      })
    }
  })

  const user = []
  const user_db = db.ref('/User')
  const snapshot_user = await user_db.once('value')

  snapshot_user.forEach(doc => {
    user.push({
      email: doc.val().email,
      name: doc.val().name,
      password: doc.val().password,
      surname: doc.val().surname,
      uId: doc.val().uId,
    })
  })

  // console.log("Users", user);

  const scan = []
  let promise = [];
  scanner.forEach(sn => {
    user.forEach(us => {
      if (us.uId == sn.uId) {
        scan.push({
          id: sn.id,
          scId: sn.scId,
          email: us.email,
          name: us.name,
          password: us.password,
          piority: us.piority,
          surname: us.surname,
          uId: us.uId,
          status: sn.status
        })
      }
    })
  })

  let result = scan.concat(p);

  res.json({ data: result })
})


// // app.put('/updateScanner', (req, res) => {



// // })

// //User
app.post('/login', (req, res) => {

  const email = req.body.email
  const password = req.body.password
  console.log(email)
  console.log(password)

  firebase.signInWithEmail(email, password, async function (err, result) {
    if (err)
      return res.status(500).json({
        message: err.message
      })
    else {
      const user = result.user;
      const uid = user.id
      await db.ref('User/' + uid).once('value')
        .then(res => {
          user.fullname = res.val().name + " " + res.val().surname;
          user.name = res.val().name;
          user.surname = res.val().surname;
          user.uId = res.val().uId;
          user.password = res.val().password;
          user.piority = res.val().piority;
        })
        .catch(err => {
          res.status(500).json({ message: err.message })
        })
      return res.json({
        message: 'PASS',
        status: {
          dataStatus: 'SUCCESS'
        },
        data: result
      })
    }
  })
  // return res.status(200).json({
  //   message: "Login Success",
  //   data: result
  // })
})

app.post('/signup', (req, res) => {

  const email = req.body.email
  const password = req.body.password
  const extra = {
    name: req.body.name + " " + req.body.surname
  }
  console.log(email)
  console.log(password)
  firebase.registerWithEmail(email, password, extra, function (err, result) {
    if (err) {
      res.status(500).json({
        message: err.message
      })
      return;
    }
    else {
      const user = result.user
      const doc_id = user.id
      console.log(doc_id)
      let customclaims;
      if (req.body.piority === 'NISIT') {
        customclaims = {
          nisit: true
        }
      }

      else if (req.body.piority === 'PROFESSOR') {
        customclaims = {
          professor: true
        }
      }

      db.ref('User/' + doc_id).set({
        uId: req.body.uId,
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
        piority: req.body.piority,
        password: req.body.password

      })
        .then(() => {
          admin.auth().setCustomUserClaims(doc_id, customclaims);
        })
        .catch(err => {
          console.log(err.message);
        })

      res.status(201).json({
        message: "Add Success"
      })
    }
  })

})

app.delete('/deleteUser/:uid', async (req, res) => {

  const uid = req.params.uid;
  console.log(uid)

  await admin.auth().deleteUser(uid)
    .then(async () => {
      const user = await db.ref('/User').child(uid).once('value')
      const uId = user.val().uId;
      console.log(uId)

      await db.ref('/Regis').once('value')
        .then(registrations => {
          registrations.forEach(regis => {
            if (regis.val().uId === uId) {
              // console.log(regis.key)
              db.ref(`/Regis/${regis.key}`).remove();
            }
          })
        })
    })
    .then(async () => {
      await db.ref(`/User/${uid}`).remove()
        .then(() => {
          console.log("Delete User Authen Success")
          return res.status(200).json({
            message: "Delete Success"
          })
        })
    })
    .catch(err => {
      return res.status(500).json({
        message: err.message
      })
    })



  //   })
  //   .catch(err => {
  //     console.log(err.message)
  //   })
})

app.delete('/deleteSection/:id', professor_permission, async (req, res) => {
  const section_id = req.params.id;
  const regis = [];
  try {
    await db.ref('/Section/' + section_id).remove()
      .then(async () => {
        await db.ref('/Regis').once('value')
          .then(registrations => {
            registrations.forEach(row_regis => {
              if (row_regis.val().sId === section_id) {
                regis.push({
                  id: row_regis.key,
                  uId: row_regis.val().uId,
                  sId: row_regis.val().sId
                })
              }
            })
          })
        return regis;
      })
      .then(async (prev_result) => {
        let promise = [];
        prev_result.forEach(row_regis => {
          promise.push(db.ref('/Regis/' + row_regis.id).remove())
        })
        await Promise.all(promise)
      })
      .then(() => {
        return res.status(200).json({
          message: "Delete Section Success",
          status: {
            dataStatus: "SUCCESS"
          }
        })
      })
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      status: {
        dataStatus: "Failure"
      }
    })
  }
})

app.put('/UpdateUser/:id', (req, res) => {

  const id = req.params.id;
  admin.auth().updateUser(id, {
    email: req.body.email,
    password: req.body.password,
    displayName: req.body.firstname + " " + req.body.lastname
  })
    .then(() => {
      db.ref('User/' + id).update({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        surname: req.body.surname,
        uId: req.body.uId
      })
        .then(() => {
          return res.status(200).json({
            message: "Update Success"
          })
        })
    }
    )
})


app.put('/updateScanner/:id', professor_permission, async (req, res) => {

  let section_id = req.params.id;

  const scanner_id = req.body.scanner_id;
  const scanner_value = req.body.scanner;

  try {
    if (scanner_id !== "") {
      await db.ref('/Scanner').child(scanner_id).update({
        uId: req.id,
      })
      .then(async () => {
          await db.ref('/Section').child(section_id).update({
            scId: scanner_value
          })

      })
      .then(() => {
        return res.status(200).json({
          message: "Update Success",
          status: {
            dataStatus: 'SUCCESS'
          }
        })
      })
    }
    else{
      await db.ref('/Section').child(section_id).update({
        scId: ""
      })
      .then(() => {
        return res.status(200).json({
          message: "Update Success",
          status: {
            dataStatus: 'SUCCESS'
          }
        })
      })
    }
  }
  catch (err) {
    return res.status(500).json({
      message: err.message
    })
  }

})

app.delete('/deleteScanner/:id',professor_permission,async (req,res) => {

  const scanner_id = req.params.id;

  let scanner = await db.ref('/Scanner').child(scanner_id).once('value');

  let scanner_value = scanner.val().scId;

  await db.ref('/Scanner').child(scanner_id).remove()
  .then(async () => {
     await db.ref('/Section').once('value')
     .then(sections => {
        sections.forEach(s => {
          if(s.val().scId === scanner_value){
             db.ref('/Section').child(s.key).update({
               scId : ""
             })
          }
        })
     })
  })
  .then(() => {
    return res.status(200).json({
      message:"Delete Scanner Success",
      status : {
        dataStatus:"Success"
      }
    })
  })
  .catch(err => {
    return res.status(500).json({
      message:err.message
    })
  })
})


app.get('/getSectionforStudent',nisit_permission,async (req,res) => {
  
  const regis = [];
  const section_data = [];
  // console.log(req.id)
  await db.ref('/Regis').once('value')
  .then(async registrations => {
     registrations.forEach(row_regis => {
        if(row_regis.val().uId === req.id){
          regis.push({
            id : row_regis.key,
            uId : row_regis.val().uId,
            sId : row_regis.val().sId
          })
        }
     })
    
     await db.ref('/Section').once('value')
     .then(sections => {
       sections.forEach(row_section => {
         regis.forEach(row_regis => {
           if(row_section.key === row_regis.sId){
              section_data.push({
                id : row_regis.id,
                section_id : row_section.val().sId,
                room: row_section.val().room,
                sectionNumber : row_section.val().sectionNumber,
                subject : row_section.val().subject,
                timetable : row_section.val().timetable,
                uId : row_section.val().uId
              })
           }
         })
       })

       console.log(section_data)
     })

     return res.status(200).json({
       message:"Get Data Success",
       data : section_data
     })
  })
})



app.get('/getAttandace/:id', async (req, res) => {

  const section_id = req.params.id;
  const classBySection = [];
  try {

    const sections = await db.ref('/Section').child(section_id).once('value');
    const timelate = sections.val().timelate;
    const list_class = await db.ref('/Class').orderByChild('sectionID').equalTo(section_id).once('value');
    const promise = [];

    list_class.forEach(row_class => {
      let date = moment.unix(row_class.val().dateTime).tz('Asia/Bangkok').format('DD/MM/YYYY')
      let time = moment.unix(row_class.val().dateTime).tz('Asia/Bangkok').format('HH:mm');
      classBySection.push({
        id: row_class.key,
        date: date,
        time:time
      })
    })

    const user = [];
    await db.ref('/Regis').orderByChild('sId').equalTo(section_id)
      .once('value')
      .then((registration) => {
        registration.forEach(row => {
          promise.push(db.ref('/User').orderByChild('uId').equalTo(row.val().uId).once('value')
            .then(users => {
              users.forEach(row_user => {
                user.push({
                  id: row_user.key,
                  name: row_user.val().name,
                  surname: row_user.val().surname,
                  uId: row_user.val().uId
                })
              })
            }))
        })
      })

    await Promise.all(promise).catch(err => { console.log(err.message) });
    const fingerPrint = [];
    const user_fingerprint = await db.ref('/Fingerprint').once('value')

    user_fingerprint.forEach(row => {
      fingerPrint.push({
        fId: row.val().fId,
        uId: row.val().uId
      })
    })

    const uniqueResultOne = user.filter(function (obj) {
      return fingerPrint.some(function (obj2) {
        if (obj.uId == obj2.uId) {
          obj.fId = obj2.fId
          return obj;
        }
      });
    })

    const uniqueResulttwo = user.filter(function (obj) {
      return !fingerPrint.some(function (obj2) {
        return obj.uId == obj2.uId;
      });
    })

    //Combine the two arrays of unique entries
    const result = uniqueResultOne.concat(uniqueResulttwo);

    const r = [];
    const class_attendance = [];
    classBySection.forEach(row_class => {
      let date = row_class.date;
      let class_id = row_class.id;
      r.push(db.ref('/Attendance').orderByChild('class_id').equalTo(row_class.id).once('value')
        .then(class_attan => {
          class_attan.forEach(row => {
            class_attendance.push({
              id: row.key,
              class_id: class_id,
              checktime: row.val().checkTime,
              fId: Number(row.val().fId),
              open_time: date,
              status: row.val().status
            })
          })
        }));
    })

    await Promise.all(r);
    const final = [];
    
    const attandance = class_attendance.filter(function (obj) {
      return result.some(function (obj2) {
        if (obj.fId === obj2.fId) {
          let class_date = obj.open_time
          let checkInTime = moment.unix(obj.checktime).format('HH:mm');
          final.push({
             uId : obj2.uId,
             name: obj2.name + " " + obj2.surname,
             date: class_date,
             time : checkInTime,
             status: obj.status
          })
          return;
        }
      });
    })

    const unique = result.filter(f => {
      return !class_attendance.some(attan => {
        return attan.fId === f.fId;
      })
    })

    const unattandance = unique.map(row => {
      return {
        uId: row.uId,
        name: row.name + " " + row.surname,
      }
    })

    const rr = final.concat(unattandance);

    
    

    // console.log(final)
    if (final.length === 0) {
      final.push(user)
    }
    return res.status(200).json({
      data: {
        section: {
          room: sections.val().room,
          sId: sections.val().sId,
          sectionNumber: sections.val().sectionNumber,
          subject: sections.val().subject,
          timelate: sections.val().timelate,
          timetable: sections.val().timetable
        },
        classes: classBySection,
        student: rr
      }
    })
  }
  catch (error) {
    return res.status(500).json({
      message: error.message,
      status: {
        dataStatus: "FAILURE"
      }
    })
  }
})
exports.api = functions.https.onRequest(app)




