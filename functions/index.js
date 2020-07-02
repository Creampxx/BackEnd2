const functions = require('firebase-functions');
const admin = require('firebase-admin')
const FirebaseAuth = require('firebaseauth');
const config = require('./config');
const bodyParser = require('body-parser');
const firebase = new FirebaseAuth(config.apikey);
var serviceAccount = require("./service_account.json");

const express = require('express')
const app = express()
const cors = require('cors')

app.use(cors())
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
    let id ;
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



app.get('/getSection', professor_permission, async (req, res) => {
  try{
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
        room:d.val().room
      })
    })

    console.log(section)
    console.log(req.id)
    let arr = [];
    for (let i = 0; i < section.length; i++) {
      if (section[i].uId === req.id) {
        if (section[i].scId !== "") {
          arr.push({
            id: section[i].id,
            subject: section[i].subject,
            sId: section[i].sId,
            sectionNumber: section[i].sectionNumber,
            scId: section[i].scId,
            uId: section[i].uId,
            room: section[i].room
          })
        }
        else{
          arr.push({
            id: section[i].id,
            subject: section[i].subject,
            sId: section[i].sId,
            sectionNumber: section[i].sectionNumber,
            scId: "เชื่อม",
            uId: section[i].uId,
            room: section[i].room
          })
        }
      }
    }
  
    return res.status(200).json({
      message:"Get Success",
      data : arr
    })
  }
  catch(err){
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

app.delete('/deleteUser/:uid', (req, res) => {

  const uid = req.params.uid;
  admin.auth().deleteUser(uid)
    .then(() => {
      console.log("Delete User Authen Success")
    })
    .catch(err => {
      console.log(err.message)
    })
})

app.put('/UpdateScanner/:id',(req,res)=> {
   
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






exports.api = functions.https.onRequest(app)




