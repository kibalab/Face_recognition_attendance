const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/upload', function (req, res) {
    const image = req.body.image;

    filename = "./uploads/image.png";
    // Base64 인코딩된 문자열에서 데이터 타입 정보를 추출합니다.
    const dataInfo = /^data:(.+);base64,(.*)$/.exec(image);
    const mimeType = dataInfo[1];
    const base64Data = dataInfo[2];

    // Base64 디코딩하여 바이너리 데이터로 변환합니다.
    const binaryData = Buffer.from(base64Data, 'base64');

    // 바이너리 데이터를 파일로 저장합니다.
    fs.writeFile(filename, binaryData, 'binary', (err) => {
        if (err) throw err;
        console.log(`The file ${filename} has been saved!`);
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const modelsDir = './models';
const libDir = './lib';
const studentsDir = './students';

// models 폴더 내의 모든 파일을 라우팅
fs.readdirSync(modelsDir).forEach(file => {
    app.use(`/models/${file}`, express.static(`${modelsDir}/${file}`));
});

fs.readdirSync(libDir).forEach(file => {
    app.use(`/${file}`, express.static(`${libDir}/${file}`));
});

fs.readdirSync(studentsDir).forEach(file => {
    app.use(`/students/${file.name}`, express.static(`${studentsDir}/${file.name}`));
});

app.use(express.static('public'));

app.use('/students', express.static(path.join(__dirname, 'students')));

app.get('/students', (req, res) => {
    const studentsPath = path.join(__dirname, 'students');

    fs.readdir(studentsPath, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const studentNames = files.map((file) => {
            const fileName = path.parse(file).name;
            const fileExt = path.parse(file).ext;
            return {
                name: fileName,
                extension: fileExt
            };
        });

        res.json(studentNames);
    });
});

const upload = multer({ dest: 'students/' });
app.post('/students', upload.single('file'));

app.delete('/students/:name', (req, res) => {
    const fileName = req.params.name;

    // 파일 제거
    const filesPath = path.join(__dirname, 'students');
    fs.readdir(filesPath, (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
            return;
        }

        const matchingFiles = files.filter(file => {
            return path.basename(file, path.extname(file)) === fileName;
        });

        matchingFiles.forEach(file => {
            fs.unlink(path.join(filesPath, file), err => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal server error');
                    return;
                }

                console.log(`File ${file} removed`);
            });
        });

        res.status(204).send();
    });
});

app.listen(80, () => {
    console.log('Server started on port 80');
});
