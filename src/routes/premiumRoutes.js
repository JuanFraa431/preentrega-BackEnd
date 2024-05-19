const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const premiumController = require('../controllers/premiumController');

// Ruta para obtener la lista de usuarios
router.get('/', premiumController.getUsers);

router.delete('/', premiumController.deleteInactiveUsers);

router.post('/premium/:uid', premiumController.updateUserRole);

router.get('/documents/:uid', premiumController.getUserDocuments);

router.get('/documents', premiumController.renderDocumentPage);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const upload = multer({ storage });

router.post('/:uid/documents', upload.array('documents', 3), premiumController.uploadDocuments);

router.post('/delete-user/:userId', premiumController.deleteUser);

module.exports = router;