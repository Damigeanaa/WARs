import sqlite3 from 'sqlite3'
import { promisify } from 'util'

const db = new sqlite3.Database('./database.db')

// Properly typed promisified database methods with better error handling
export const dbRun = async (sql: string, params?: any[]): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

export const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>
export const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>

export { db }
