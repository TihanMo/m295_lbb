const express = require('express');
const app = express();
const fs = require('fs');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');

const port = 3000;
const taskData = require('./taskData.json');
const Users = [
    { 'email': 'admin', 'password': 'password' },
    { 'email': 'user', 'password': '123456' },
    { 'email': 'm295', 'password': 'm295'}
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}));

const swaggerDocument = require('./swagger_output.json');
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs', (req, res) => {
    res.status(302).redirect('http://localhost:3000/swagger-ui');
});

app.get('/tasks', (req, res) => {
    const id = req.query.id;
    if (id) {
      const task = taskData.tasks.find((task) => task.id === id);
      if (task) {
        res.status(200).send(task);
      } else {
        res.status(404).send('Aufgabe wurde nicht gefunden.');
      }
    } else {
      res.status(200).send(taskData);
    }
});
  
app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const task = taskData.tasks.find((task) => {task.id === taskId});
    if (task) {
      res.status(200).send(task);
    } else {
      res.status(404).send('Aufgabe wurde nicht gefunden.');
    }
});  

app.post('/tasks', (req, res) => {
    const newTask = req.body;
    taskData.push(newTask);
    res.status(201).send(newTask);
  });

app.put('/tasks', (req, res) => {
    const updatedTask = req.body.task;


});

app.delete('/tasks', (req, res) => {
    
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
});
