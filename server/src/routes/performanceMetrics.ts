import { Router } from 'express'
import { dbRun, dbGet, dbAll } from '../database/database.js'
import { auditMiddleware } from '../middleware/auditLogger.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const performanceMetricSchema = z.object({
  driver_id: z.number(),
  driver_name: z.string().min(1),
  delivery_associate_id: z.string().optional(),
  week: z.string().min(1),
  delivered_packages: z.number().min(0).default(0),
  packages_dnr: z.number().min(0).default(0),
  dnr_dpmo: z.number().min(0).default(0),
  dispatched_packages: z.number().min(0).default(0),
  packages_rts: z.number().min(0).default(0),
  rts_percentage: z.number().min(0).max(100).default(0),
  rts_dpmo: z.number().min(0).default(0),
  dcr_percentage: z.number().min(0).max(100).default(0),
  lor_dpmo: z.number().min(0).default(0),
  pod_percentage: z.number().min(0).max(100).default(0),
  cc_percentage: z.number().min(0).max(100).default(0),
  ce_percentage: z.number().min(0).max(100).default(0),
  cdf_percentage: z.number().min(0).max(100).default(0)
})

const csvImportSchema = z.object({
  data: z.array(z.object({
    week: z.string(),
    driver_name: z.string(),
    delivery_associate_id: z.string().optional(),
    // Basic delivery data (from concessions CSV)
    delivered_packages: z.union([z.string(), z.number()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    packages_dnr: z.union([z.string(), z.number()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    dnr_dpmo: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/,/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    dispatched_packages: z.union([z.string(), z.number()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    packages_rts: z.union([z.string(), z.number()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    rts_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    rts_dpmo: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/,/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    // Extended performance metrics
    dcr_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    lor_dpmo: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/,/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    pod_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    cc_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    ce_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0),
    cdf_percentage: z.union([z.string(), z.number()]).transform(val => {
      const str = val.toString().replace(/%/g, '')
      const num = parseFloat(str)
      return isNaN(num) ? 0 : num
    }).optional().default(0)
  }))
})

// Get all performance metrics
router.get('/', async (req, res) => {
  try {
    const metrics = await dbAll(`
      SELECT pm.*, d.name as driver_name
      FROM performance_metrics pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      ORDER BY pm.week DESC, pm.delivered_packages DESC
    `)
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    res.status(500).json({ error: 'Failed to fetch performance metrics' })
  }
})

// Get performance metrics for a specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params
    const metrics = await dbAll(`
      SELECT * FROM performance_metrics 
      WHERE driver_id = ? 
      ORDER BY week DESC
    `, [driverId])
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching driver performance metrics:', error)
    res.status(500).json({ error: 'Failed to fetch driver performance metrics' })
  }
})

// Get performance metrics for a specific week
router.get('/week/:week', async (req, res) => {
  try {
    const { week } = req.params
    const metrics = await dbAll(`
      SELECT pm.*, d.name as driver_name
      FROM performance_metrics pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.week = ?
      ORDER BY pm.delivered_packages DESC
    `, [week])
    res.json(metrics)
  } catch (error) {
    console.error('Error fetching week performance metrics:', error)
    res.status(500).json({ error: 'Failed to fetch week performance metrics' })
  }
})

// Import performance metrics from pasted data
router.post('/import', auditMiddleware, async (req, res) => {
  try {
    console.log('Performance metrics import request:', req.body)
    
    // Handle pasted CSV data
    if (!req.body.csvData) {
      return res.status(400).json({ message: 'No CSV data provided' });
    }

    const csvData = req.body.csvData;
    const week = req.body.week || 36; // Use provided week or default to 36

    // Parse pasted data - can be space-separated or comma-separated
    const lines = csvData.trim().split('\n');
    if (lines.length < 1) {
      return res.status(400).json({ message: 'No data rows found' });
    }

    console.log('Pasted data lines:', lines);

    let processed = 0;
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const line of lines) {
      try {
        processed++;
        
        // Parse space-separated or tab-separated data
        const values = line.trim().split(/\s+/);
        
        // Skip header row (check if first value looks like a header)
        if (values[0] && (
          values[0].toLowerCase().includes('transporter') ||
          values[0].toLowerCase().includes('driver') ||
          values[0].toLowerCase().includes('id') ||
          values[0] === 'Transporter'
        )) {
          console.log(`Skipping header row ${processed}:`, values);
          continue;
        }
        
        if (values.length < 8) {
          errors.push(`Row ${processed}: Insufficient data columns (expected at least 8, got ${values.length})`);
          continue;
        }

        // Expected format: Transporter_ID Delivered DCR DNR_DPMO LoR_DPMO POD CC CE CDF
        const [transporterId, delivered, dcr, dnrDpmo, lorDpmo, pod, cc, ce, cdf] = values;

        console.log(`Row ${processed} data:`, { transporterId, delivered, dcr, dnrDpmo, lorDpmo, pod, cc, ce, cdf });

        // Find driver by driver_id (Transporter ID matches driver_id)
        const driver = await dbGet(`
          SELECT id, driver_id, name FROM drivers 
          WHERE driver_id = ?
        `, [transporterId]);

        if (!driver) {
          errors.push(`Row ${processed}: Driver not found for Transporter ID: ${transporterId}`);
          continue;
        }
        
        const driverId = driver.id;
        // Use the week provided from the frontend

        // Helper function to parse numbers with commas and handle empty values
        const parseNumber = (value: string): number => {
          if (!value || value.trim() === '' || value === '-') return 0;
          return parseInt(value.replace(/,/g, '')) || 0;
        };

        // Helper function to parse percentages
        const parsePercentage = (value: string): number => {
          if (!value || value.trim() === '' || value === '-') return 0;
          const numStr = value.replace('%', '').replace(',', '.');
          return parseFloat(numStr) || 0;
        };

        // Check if metric already exists
        const existingMetric = await dbGet(`
          SELECT id FROM performance_metrics 
          WHERE driver_id = ? AND week = ?
        `, [driverId, week]);

        // Extended performance format data
        const performanceData = {
          delivered_packages: parseNumber(delivered),
          packages_dnr: parseNumber(dnrDpmo), // Using DNR DPMO as DNR count approximation
          dnr_dpmo: parseNumber(dnrDpmo),
          dispatched_packages: parseNumber(delivered), // Approximate
          packages_rts: 0, // Not available in this format
          rts_percentage: 0, // Not available in this format
          rts_dpmo: 0, // Not available in this format
          dcr_percentage: parsePercentage(dcr),
          lor_dpmo: parseNumber(lorDpmo),
          pod_percentage: parsePercentage(pod),
          cc_percentage: parsePercentage(cc),
          ce_percentage: parsePercentage(ce),
          cdf_percentage: parsePercentage(cdf)
        };

        const driverName = driver.name;

        if (existingMetric) {
          await dbRun(`
            UPDATE performance_metrics SET
              driver_name = ?,
              delivered_packages = ?,
              packages_dnr = ?,
              rts_percentage = ?,
              dnr_dpmo = ?,
              dispatched_packages = ?,
              packages_rts = ?,
              rts_dpmo = ?,
              dcr_percentage = ?,
              lor_dpmo = ?,
              pod_percentage = ?,
              cc_percentage = ?,
              ce_percentage = ?,
              cdf_percentage = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            driverName,
            performanceData.delivered_packages,
            performanceData.packages_dnr,
            performanceData.rts_percentage,
            performanceData.dnr_dpmo,
            performanceData.dispatched_packages,
            performanceData.packages_rts,
            performanceData.rts_dpmo,
            performanceData.dcr_percentage,
            performanceData.lor_dpmo,
            performanceData.pod_percentage,
            performanceData.cc_percentage,
            performanceData.ce_percentage,
            performanceData.cdf_percentage,
            existingMetric.id
          ]);
          updated++;
        } else {
          await dbRun(`
            INSERT INTO performance_metrics (
              driver_id, driver_name, week, delivered_packages, packages_dnr, 
              rts_percentage, dnr_dpmo, dispatched_packages, packages_rts, rts_dpmo,
              dcr_percentage, lor_dpmo, pod_percentage, cc_percentage, ce_percentage, cdf_percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            driverId, driverName, week,
            performanceData.delivered_packages,
            performanceData.packages_dnr,
            performanceData.rts_percentage,
            performanceData.dnr_dpmo,
            performanceData.dispatched_packages,
            performanceData.packages_rts,
            performanceData.rts_dpmo,
            performanceData.dcr_percentage,
            performanceData.lor_dpmo,
            performanceData.pod_percentage,
            performanceData.cc_percentage,
            performanceData.ce_percentage,
            performanceData.cdf_percentage
          ]);
          imported++;
        }

      } catch (rowError) {
        console.error('Error processing row:', rowError);
        errors.push(`Row ${processed}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      processed,
      imported,
      updated,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `Successfully processed ${imported + updated} performance records. ${imported} imported, ${updated} updated.`
    });

  } catch (error) {
    console.error('Error importing performance metrics:', error);
    res.status(400).json({ 
      error: 'Failed to import performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add or update a single performance metric
router.post('/', auditMiddleware, async (req, res) => {
  try {
    const validatedData = performanceMetricSchema.parse(req.body)
    
    // Check if metric already exists for this driver and week
    const existingMetric = await dbGet(`
      SELECT id FROM performance_metrics 
      WHERE driver_id = ? AND week = ?
    `, [validatedData.driver_id, validatedData.week])

    if (existingMetric) {
      // Update existing metric
      await dbRun(`
        UPDATE performance_metrics SET
          driver_name = ?,
          delivery_associate_id = ?,
          delivered_packages = ?,
          packages_dnr = ?,
          dnr_dpmo = ?,
          dispatched_packages = ?,
          packages_rts = ?,
          rts_percentage = ?,
          rts_dpmo = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        validatedData.driver_name,
        validatedData.delivery_associate_id,
        validatedData.delivered_packages,
        validatedData.packages_dnr,
        validatedData.dnr_dpmo,
        validatedData.dispatched_packages,
        validatedData.packages_rts,
        validatedData.rts_percentage,
        validatedData.rts_dpmo,
        existingMetric.id
      ])
      
      const updatedMetric = await dbGet('SELECT * FROM performance_metrics WHERE id = ?', [existingMetric.id])
      res.json(updatedMetric)
    } else {
      // Insert new metric
      const result = await dbRun(`
        INSERT INTO performance_metrics (
          driver_id, driver_name, delivery_associate_id, week,
          delivered_packages, packages_dnr, dnr_dpmo,
          dispatched_packages, packages_rts, rts_percentage, rts_dpmo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        validatedData.driver_id,
        validatedData.driver_name,
        validatedData.delivery_associate_id,
        validatedData.week,
        validatedData.delivered_packages,
        validatedData.packages_dnr,
        validatedData.dnr_dpmo,
        validatedData.dispatched_packages,
        validatedData.packages_rts,
        validatedData.rts_percentage,
        validatedData.rts_dpmo
      ])
      
      const newMetric = await dbGet('SELECT * FROM performance_metrics WHERE id = ?', [result.lastID])
      res.status(201).json(newMetric)
    }
  } catch (error) {
    console.error('Error creating/updating performance metric:', error)
    res.status(400).json({ 
      error: 'Failed to create/update performance metric',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete a performance metric
router.delete('/:id', auditMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const metric = await dbGet('SELECT * FROM performance_metrics WHERE id = ?', [id])
    
    if (!metric) {
      return res.status(404).json({ error: 'Performance metric not found' })
    }
    
    await dbRun('DELETE FROM performance_metrics WHERE id = ?', [id])
    res.json({ message: 'Performance metric deleted successfully' })
  } catch (error) {
    console.error('Error deleting performance metric:', error)
    res.status(500).json({ error: 'Failed to delete performance metric' })
  }
})

// Get performance summary statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { week, driverId } = req.query
    
    let whereClause = ''
    const params: any[] = []
    
    if (week) {
      whereClause += ' WHERE week = ?'
      params.push(week)
    }
    
    if (driverId) {
      whereClause += whereClause ? ' AND driver_id = ?' : ' WHERE driver_id = ?'
      params.push(driverId)
    }
    
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_records,
        SUM(delivered_packages) as total_delivered,
        SUM(packages_dnr) as total_dnr,
        SUM(dispatched_packages) as total_dispatched,
        SUM(packages_rts) as total_rts,
        AVG(rts_percentage) as avg_rts_percentage,
        AVG(dnr_dpmo) as avg_dnr_dpmo,
        AVG(rts_dpmo) as avg_rts_dpmo
      FROM performance_metrics
      ${whereClause}
    `, params)
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching performance summary:', error)
    res.status(500).json({ error: 'Failed to fetch performance summary' })
  }
})

// Get all performance data grouped by week
router.get('/weeks', async (req, res) => {
  try {
    const weeks = await dbAll(`
      SELECT 
        week,
        COUNT(*) as driver_count,
        MIN(created_at) as imported_at,
        MAX(updated_at) as last_updated
      FROM performance_metrics
      GROUP BY week
      ORDER BY CAST(week AS INTEGER) DESC
    `)
    
    res.json(weeks)
  } catch (error) {
    console.error('Error fetching weeks:', error)
    res.status(500).json({ error: 'Failed to fetch weeks' })
  }
})

// Get performance data for a specific week
router.get('/week/:week', async (req, res) => {
  try {
    const { week } = req.params
    
    const data = await dbAll(`
      SELECT 
        pm.*,
        d.name as driver_name
      FROM performance_metrics pm
      LEFT JOIN drivers d ON pm.driver_id = d.id
      WHERE pm.week = ?
      ORDER BY pm.driver_id
    `, [week])
    
    res.json(data)
  } catch (error) {
    console.error('Error fetching week data:', error)
    res.status(500).json({ error: 'Failed to fetch week data' })
  }
})

// Delete performance data for a specific week
router.delete('/week/:week', auditMiddleware, async (req, res) => {
  try {
    const { week } = req.params
    
    // First, get count of records to be deleted
    const countResult = await dbGet('SELECT COUNT(*) as count FROM performance_metrics WHERE week = ?', [week])
    const recordCount = countResult?.count || 0
    
    if (recordCount === 0) {
      return res.status(404).json({ error: 'No data found for this week' })
    }
    
    // Delete the records
    await dbRun('DELETE FROM performance_metrics WHERE week = ?', [week])
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${recordCount} performance records for week ${week}`,
      deletedCount: recordCount
    })
  } catch (error) {
    console.error('Error deleting week data:', error)
    res.status(500).json({ error: 'Failed to delete week data' })
  }
})

export default router
