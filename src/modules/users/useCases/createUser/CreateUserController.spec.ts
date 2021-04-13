import request from 'supertest'
import { Connection, createConnection } from 'typeorm'
import { app } from '../../../../app'

let connection: Connection

describe('Create User Controller', () => {
  beforeAll(async () => {
    connection = await createConnection()

    await connection.runMigrations()
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it('should be able to create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Gustavo Oliveira',
        email: 'gustavo@gustavo.com',
        password: 'gustavodevom'
      })

    expect(response.status).toBe(201)
  })

  it('should not be able to create a user with the email from another', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'Gustavo Oliveira',
        email: 'gustavo@gustavo.com',
        password: 'gustavodevom'
      })

    expect(response.body.message).toEqual("User already exists")
  })
})
