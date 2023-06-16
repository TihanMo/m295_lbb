const express = require('express')
const app = express()
const fs = require('fs')
const session = require('express-session')
const swaggerUi = require('swagger-ui-express')
const { v4: uuidv4 } = require('uuid')

const port = 3000
const taskData = JSON.parse(fs.readFileSync('src/taskData.json', 'utf8'))
const Users = [
  { email: 'admin', password: 'password' },
  { email: 'user', password: '123456' },
  { email: 'm295', password: 'm295' }
]

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000
  }
}))

const swaggerDocument = require('./swagger_output.json')
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get('/api-docs', (req, res) => {
  res.status(302).redirect('http://localhost:3000/swagger-ui')
})

app.post('/login', (req, res) => {
  const { email, password } = req.body

  const user = Users.find((user) => user.email === email && user.password === password)

  if (user) {
    req.session.user = email
    res.send('Login successful')
  } else {
    res.status(401).send('Invalid email or password')
  }
})

app.get('/verify', (req, res) => {
  if (req.session.user != null) {
    res.send(`User ${req.session.user} is logged in`)
  } else {
    res.status(401).send('User not logged in')
  }
})

app.delete('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err)
      res.sendStatus(500)
    } else {
      res.send('Logged out successfully')
    }
  })
})

app.get('/tasks', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }
  const tasks = taskData.tasks.filter((task) => task.User === req.session.user)
  res.status(200).send(tasks)
})

app.get('/tasks/:id', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }

  const taskId = req.params.id
  const task = taskData.tasks.find((task) => task.id === taskId)

  if (req.session.user !== task.User) {
    return res.sendStatus(403)
  }

  if (task) {
    res.status(200).send(task)
  } else {
    res.status(404).send('Task was not found')
  }
})

app.post('/tasks', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }
  const newTask = {
    id: uuidv4(),
    User: req.session.user,
    Titel: req.body.Titel ? req.body.Titel : null,
    Beschreibung: req.body.Beschreibung ? req.body.Beschreibung : null,
    Erstellungsdatum: req.body.Erstellungsdatum ? req.body.Erstellungsdatum : null,
    Erfüllungsdatum: req.body.Erfüllungsdatum ? req.body.Erfüllungsdatum : null
  }

  taskData.tasks.push(newTask)
  fs.writeFileSync('src/taskData.json', JSON.stringify(taskData))
  res.status(201).json(newTask)
})

app.put('/tasks/:id', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }

  const taskId = req.params.id
  const updatedTask = req.body
  const taskIndex = taskData.tasks.findIndex((task) => task.id === taskId)

  if (taskIndex !== -1) {
    const task = taskData.tasks[taskIndex]
    if (req.session.user !== task.User) {
      return res.sendStatus(403)
    }

    taskData.tasks[taskIndex] = { ...task, ...updatedTask }
    fs.writeFileSync('src/taskData.json', JSON.stringify(taskData))
    res.status(200).send(taskData.tasks[taskIndex])
  } else {
    res.status(404).send('Task was not found')
  }
})

app.delete('/tasks/:id', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }

  const taskId = req.params.id
  const taskIndex = taskData.tasks.findIndex((task) => task.id === taskId)

  if (taskIndex !== -1) {
    const task = taskData.tasks[taskIndex]
    if (req.session.user !== task.User) {
      return res.sendStatus(403)
    }

    const deletedTask = taskData.tasks.splice(taskIndex, 1)
    fs.writeFileSync('src/taskData.json', JSON.stringify(taskData))
    res.status(200).send(`Task ${deletedTask[0].Titel} was successfully deleted`)
  } else {
    res.status(404).send('Task was not found')
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
