require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const cors = require('cors');

const app = express();
const port = process.env.serverport || 8081;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

app.post('/seeds', async (req, res) => {
  const {
      qr_code,
      seed_id,
      description,
      germinated,
      vigorous,
      small,
      abnormal,
      usable,
      group_size,
      day_number,
      date_scanned,
      time_scanned,
      has_pictures,
      images
  } = req.body;

  const client = await pool.connect();

  try {
      await client.query('BEGIN');

      const seedDataResult = await client.query(
          `INSERT INTO SeedData (qr_code, seed_id, description, germinated, vigorous, small, abnormal, usable, group_size, day_number, date_scanned, time_scanned, has_pictures)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [
              qr_code,
              seed_id,
              description || null,
              germinated,
              vigorous,
              small,
              abnormal,
              usable,
              group_size || null,
              day_number || null,
              date_scanned || null,
              time_scanned || null,
              has_pictures
          ]
      );

      const seedDataId = seedDataResult.rows[0].id;

      if (images && images.length > 0) {
          const imageInserts = images.map(image => {
              const pictureBuffer = Buffer.from(image, 'base64');
              return client.query(
                  `INSERT INTO SeedPictures (seed_data_id, picture)
                  VALUES ($1, $2)`,
                  [seedDataId, pictureBuffer]
              );
          });

          await Promise.all(imageInserts);
      }

      await client.query('COMMIT');

      res.status(201).json({ message: 'Seed data and pictures saved successfully' });
  } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).send('Server error');
  } finally {
      client.release();
  }
});

app.get('/seeds', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM SeedData');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/seeds/page/:pageNumber', async (req, res) => {
  const page = parseInt(req.params.pageNumber, 10);
  const limit = parseInt(req.query.limit, 10) || 25; // Default to 25 items per page if not provided

  if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
    return res.status(400).send('Invalid page number or limit');
  }

  const offset = (page - 1) * limit;

  try {
    const result = await pool.query('SELECT * FROM SeedData LIMIT $1 OFFSET $2', [limit, offset]);

    res.json({
      page,
      limit,
      data: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/seeds/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM SeedData WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Seed not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//For testing purposes
app.get('/seeds/picture/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const result = await pool.query('SELECT picture FROM SeedPictures WHERE id = $1', [id]);

      if (result.rows.length > 0) {
          const pictureBuffer = result.rows[0].picture;
          res.set('Content-Type', 'image/jpeg');
          res.send(pictureBuffer);
      } else {
          res.status(404).send('Image not found');
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

app.get('/pictures/:seed_data_id', async (req, res) => {
  const { seed_data_id } = req.params;

  try {
    const result = await pool.query('SELECT picture FROM seedpictures WHERE seed_data_id = $1', [seed_data_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No pictures found for this seed_data_id' });
    }

    const pictures = result.rows.map(row => {
      return row.picture.toString('base64');
    });

    res.json({ pictures });
  } catch (err) {
    console.error('Error retrieving pictures:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/seeds/:id', async (req, res) => {
  const { id } = req.params;
  const {
    qr_code,
    seed_id,
    description,
    germinated,
    vigorous,
    small,
    abnormal,
    usable,
    group_size,
    day_number,
    date_scanned,
    time_scanned,
    has_pictures,
    images
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE SeedData
      SET qr_code = $1, seed_id = $2, description = $3, germinated = $4, vigorous = $5, small = $6, abnormal = $7, usable = $8, group_size = $9, day_number = $10, date_scanned = $11, time_scanned = $12, has_pictures = $13
      WHERE id = $14 RETURNING *`,
      [
        qr_code,
        seed_id,
        description || null,
        germinated,
        vigorous,
        small,
        abnormal,
        usable,
        group_size || null,
        day_number || null,
        date_scanned || null,
        time_scanned || null,
        has_pictures,
        id
      ]
    );

    if (result.rows.length > 0) {
      const updatedSeedData = result.rows[0];

      if (images && images.length > 0) {
        const imageInserts = images.map(image => {
          const pictureBuffer = Buffer.from(image, 'base64');
          return client.query(
            `INSERT INTO SeedPictures (seed_data_id, picture)
            VALUES ($1, $2)`,
            [id, pictureBuffer]
          );
        });

        await Promise.all(imageInserts);
      }

      await client.query('COMMIT');

      res.json(updatedSeedData);
    } else {
      res.status(404).send('Seed not found');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  } finally {
    client.release();
  }
});


app.delete('/seeds/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM SeedData WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Seed not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});