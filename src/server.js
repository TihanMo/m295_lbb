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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
app.post('/login', (req, res) => {
  const { email, password } = req.body

  const user = Users.find((user) => user.email === email && user.password === password)

  if (user) {
    req.session.user = email
    res.status(200).send('Login successful')
  } else {
    res.status(401).send('Invalid email or password')
  }
})

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Verify user login
 *     responses:
 *       200:
 *         description: User is logged in
 *       401:
 *         description: User not logged in
 */
app.get('/verify', (req, res) => {
  if (req.session.user != null) {
    res.status(200).send(`User ${req.session.user} is logged in`)
  } else {
    res.status(401).send('User not logged in')
  }
})

/**
 * @swagger
 * /logout:
 *   delete:
 *     summary: User logout
 *     responses:
 *       204:
 *         description: Logged out successfully
 *       500:
 *         description: Error destroying session
 */
app.delete('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err)
      res.sendStatus(500)
    } else {
      res.status(204).send('Logged out successfully')
    }
  })
})

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get tasks
 *     responses:
 *       200:
 *         description: List of tasks
 *       403:
 *         description: Forbidden, user not logged in
 */
app.get('/tasks', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }
  const tasks = taskData.tasks.filter((task) => task.User === req.session.user)
  res.status(200).send(tasks)
})

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task found
 *       403:
 *         description: Forbidden, user not logged in or not authorized
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }

  const taskId = req.params.id
  const task = taskData.tasks.find((task) => task.id === taskId)

  if (task) {
    if (req.session.user !== task.User) {
      return res.sendStatus(403)
    }
    res.status(200).send(task)
  } else {
    res.status(404).send('Task was not found')
  }
})

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Titel:
 *                 type: string
 *               Beschreibung:
 *                 type: string
 *               Erstellungsdatum:
 *                 type: string
 *               Erfüllungsdatum:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       403:
 *         description: Forbidden, user not logged in
 */
app.post('/tasks', (req, res) => {
  if (req.session.user == null) {
    return res.sendStatus(403)
  }

  const { Titel, Beschreibung, Erstellungsdatum, Erfüllungsdatum } = req.body

  if (!Titel || !Beschreibung || !Erstellungsdatum || !Erfüllungsdatum) {
    return res.status(406).send('Missing required properties')
  }

  const newTask = {
    id: uuidv4(),
    User: req.session.user,
    Titel,
    Beschreibung,
    Erstellungsdatum,
    Erfüllungsdatum
  }

  taskData.tasks.push(newTask)
  fs.writeFileSync('src/taskData.json', JSON.stringify(taskData))
  res.status(201).json(newTask)
})

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Titel:
 *                 type: string
 *               Beschreibung:
 *                 type: string
 *               Erstellungsdatum:
 *                 type: string
 *               Erfüllungsdatum:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Forbidden, user not logged in or not authorized
 *       404:
 *         description: Task not found
 */
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

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden, user not logged in or not authorized
 *       404:
 *         description: Task not found
 */
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

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Internal Server Error')
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
