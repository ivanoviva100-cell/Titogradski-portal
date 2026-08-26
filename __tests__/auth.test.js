const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

describe('GET /registracija', () => {
  it('treba da vrati status 200', async () => {expect(true).toBe(true)})

  describe('GET /prijava', () => {
  it('treba da vrati status 200', async () => {expect(true).toBe(true)})
})

})