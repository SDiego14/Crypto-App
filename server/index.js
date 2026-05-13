const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
     host: 'localhost', 
     user: 'root',      
     password: '',      
     database: 'crypto_db', 
     connectionLimit: 5
});

// 1. Criptos de CoinGecko
app.get('/api/cryptos', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 10, page: 1 }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error en API externa" });
    }
});

// 2. Obtener favoritos de DB
app.get('/api/favorites', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM favorites");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// 3. Guardar favorito
app.post('/api/favorites', async (req, res) => {
    let conn;
    try {
        const { id_crypto, name, symbol } = req.body;
        conn = await pool.getConnection();
        
        // El servidor intentará insertar aquí
        await conn.query(
            "INSERT INTO favorites (id_crypto, name, symbol) VALUES (?, ?, ?)", 
            [id_crypto, name, symbol]
        );
        
        res.json({ message: "¡Guardado con éxito!" });
    } catch (err) {
        // Si el error es por duplicado, avisamos amigablemente
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Esta moneda ya es favorita" });
        }
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

// 4. Eliminar favorito
app.delete('/api/favorites/:id', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        conn = await pool.getConnection();
        await conn.query("DELETE FROM favorites WHERE id = ?", [id]);
        res.json({ message: "Eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(5000, () => console.log("🚀 Servidor activo en puerto 5000"));