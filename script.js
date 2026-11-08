const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let currentLevel = 1;
const maxLevels = 200;
let unlockedLevels = 1;
let gameRunning = false;

const player = {
    x: 60, y: 320,
    width: 36, height: 52,
    dx: 0, dy: 0,
    speed: 5.5, jumpPower: -13,
    isGrounded: false,
    hearts: 3, ammo: 25,
    facing: 'right'
};

let platforms = [];
let decorationTrees = [];
let decorationClouds = [];
let enemies = [];
let bullets = [];
let levelGoal = { x: 880, y: 310, width: 45, height: 70 };
const keys = { left: false, right: false, up: false };

function generateLevel(lvl) {
    platforms = [];
    decorationTrees = [];
    decorationClouds = [];
    enemies = [];
    bullets = [];

    player.x = 60; player.y = 320; player.dx = 0; player.dy = 0;

    // الأرضية الأساسية
    platforms.push({ x: 0, y: 410, width: 960, height: 70, type: 'ground' });

    // منصات متعددة بارتفاعات متنوعة
    let platformCount = 3 + (lvl % 4);
    for (let i = 0; i < platformCount; i++) {
        let px = 180 + i * 160;
        let py = 320 - (i % 3) * 65;
        platforms.push({ x: px, y: py, width: 130, height: 22, type: 'platform' });

        // إضافة أشجار عشوائية فوق بعض المنصات والبيئة
        if ((i + lvl) % 2 === 0) {
            decorationTrees.push({ x: px + 40, y: py - 40, size: 25 });
        }
    }

    // أشجار إضافية على الأرضية الأساسية
    decorationTrees.push({ x: 120, y: 360, size: 35 });
    decorationTrees.push({ x: 500, y: 360, size: 30 });
    decorationTrees.push({ x: 780, y: 360, size: 38 });

    // سحب غيوم في الخلفية
    decorationClouds = [
        { x: 100, y: 50, scale: 1 },
        { x: 450, y: 80, scale: 1.3 },
        { x: 750, y: 40, scale: 0.9 }
    ];

    // توليد الوحوش بنوعين ورعاية مستويات الصعوبة
    let enemyCount = 2 + Math.floor(lvl / 8);
    for (let e = 0; e < enemyCount; e++) {
        let ex = 240 + e * 180;
        let isStrong = (e + lvl) % 2 === 0;

        enemies.push({
            x: ex, y: 365,
            width: isStrong ? 42 : 36,
            height: isStrong ? 45 : 36,
            type: isStrong ? 'orc' : 'slime',
            hp: isStrong ? 2 : 1,
            maxHp: isStrong ? 2 : 1,
            speed: (1.5 + (e * 0.2)) * (1 + lvl * 0.01),
            dir: 1,
            range: [ex - 70, ex + 70]
        });
    }
}

function update() {
    if (!gameRunning) return;

    if (keys.left) { player.dx = -player.speed; player.facing = 'left'; }
    else if (keys.right) { player.dx = player.speed; player.facing = 'right'; }
    else { player.dx = 0; }

    if (keys.up && player.isGrounded) {
        player.dy = player.jumpPower;
        player.isGrounded = false;
    }

    player.dy += 0.6;
    player.x += player.dx;
    player.y += player.dy;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.isGrounded = false;
    platforms.forEach(p => {
        if (player.x < p.x + p.width && player.x + player.width > p.x &&
            player.y + player.height >= p.y && player.y + player.height <= p.y + p.height && player.dy >= 0) {
            player.y = p.y - player.height;
            player.dy = 0;
            player.isGrounded = true;
        }
    });

    bullets.forEach((b, idx) => {
        b.x += b.speed;
        if (b.x > canvas.width || b.x < 0) bullets.splice(idx, 1);
    });

    enemies.forEach((e, eIdx) => {
        e.x += e.speed * e.dir;
        if (e.x < e.range[0] || e.x > e.range[1]) e.dir *= -1;

        bullets.forEach((b, bIdx) => {
            if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.height) {
                e.hp--;
                bullets.splice(bIdx, 1);
                if (e.hp <= 0) enemies.splice(eIdx, 1);
            }
        });

        if (player.x < e.x + e.width && player.x + player.width > e.x &&
            player.y < e.y + e.height && player.y + player.height > e.y) {
            
            if (player.dy > 0 && player.y + player.height - player.dy <= e.y + 12) {
                enemies.splice(eIdx, 1);
                player.dy = player.jumpPower * 0.7;
            } else {
                player.hearts--;
                player.x = 60; player.y = 320;
                if (player.hearts <= 0) {
                    alert("نفذت القلوب! تم إعادة المرحلة.");
                    player.hearts = 3; player.ammo = 25;
                }
            }
        }
    });

    if (player.x < levelGoal.x + levelGoal.width && player.x + player.width > levelGoal.x &&
        player.y < levelGoal.y + levelGoal.height && player.y + player.height > levelGoal.y) {
        gameRunning = false;
        if (currentLevel >= unlockedLevels) unlockedLevels = Math.min(maxLevels, currentLevel + 1);
        document.getElementById('winMenu').classList.remove('hidden');
    }
}

function drawTree(x, y, size) {
    // جذع الشجرة
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - size/6, y, size/3, size);
    // أوراق الشجرة المتعددة الطبقات
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(x, y - size/3, size/1.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(x - size/4, y - size/2, size/1.8, 0, Math.PI * 2); ctx.fill();
}

function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 25 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم السحب البيئية
    decorationClouds.forEach(c => drawCloud(c.x, c.y, c.scale));

    // رسم البلاتفورم والأرضيات
    platforms.forEach(p => {
        ctx.fillStyle = p.type === 'ground' ? '#334155' : '#475569';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x, p.y, p.width, 5);
    });

    // رسم الأشجار الزخرفية التفصيلية
    decorationTrees.forEach(t => drawTree(t.x, t.y, t.size));

    // رسم الباب الخروجي (النهاية)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(levelGoal.x, levelGoal.y, levelGoal.width, levelGoal.height);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(levelGoal.x + 6, levelGoal.y + 6, levelGoal.width - 12, levelGoal.height - 6);
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(levelGoal.x + 32, levelGoal.y + 35, 5, 0, Math.PI*2); ctx.fill();

    // رسم اللاعب التفصيلي
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(player.x, player.y + 14, player.width, player.height - 14);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(player.x + player.width/2, player.y + 12, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    let eyeOff = player.facing === 'right' ? 5 : -5;
    ctx.fillRect(player.x + player.width/2 + eyeOff, player.y + 9, 3, 3);

    // رسم الوحوش (سلايم وأورك بأشرطة الصحة)
    enemies.forEach(e => {
        if (e.type === 'slime') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(e.x + e.width/2, e.y + e.height - 8, 18, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.x + 8, e.y + 12, 5, 5);
            ctx.fillRect(e.x + 20, e.y + 12, 5, 5);
        } else {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x, e.y + 10, e.width, e.height - 10);
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(e.x + 6, e.y + 10); ctx.lineTo(e.x, e.y); ctx.lineTo(e.x + 12, e.y + 10);
            ctx.moveTo(e.x + e.width - 6, e.y + 10); ctx.lineTo(e.x + e.width, e.y); ctx.lineTo(e.x + e.width - 12, e.y + 10);
            ctx.fill();

            // بار صحة الأورك
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x, e.y - 6, e.width, 4);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(e.x, e.y - 6, (e.width * (e.hp / e.maxHp)), 4);
        }
    });

    // رسم الرصاص
    ctx.fillStyle = '#facc15';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 12, 5));

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Tahoma';
    ctx.fillText(`المرحلة: ${currentLevel} / ${maxLevels}`, 25, 35);
    ctx.fillText(`القلوب: ${"❤️".repeat(player.hearts)}`, 25, 65);
    ctx.fillText(`الرصاص: ${player.ammo} 🔫`, 25, 95);
}

function mainLoop() {
    update();
    render();
    requestAnimationFrame(mainLoop);
}

function shoot() {
    if (player.ammo > 0) {
        bullets.push({
            x: player.facing === 'right' ? player.x + player.width : player.x - 12,
            y: player.y + 22,
            speed: player.facing === 'right' ? 10 : -10
        });
        player.ammo--;
    }
}

function startGame() {
    document.getElementById('mainMenu').classList.add('hidden');
    generateLevel(currentLevel);
    gameRunning = true;
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > maxLevels) currentLevel = 1;
    document.getElementById('winMenu').classList.add('hidden');
    generateLevel(currentLevel);
    gameRunning = true;
}

function openLevelSelect() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= maxLevels; i++) {
        const btn = document.createElement('div');
        btn.className = `level-btn ${i <= unlockedLevels ? '' : 'locked'}`;
        btn.innerText = i;
        if (i <= unlockedLevels) {
            btn.onclick = () => {
                currentLevel = i;
                closeOverlay('levelMenu');
                startGame();
            };
        }
        grid.appendChild(btn);
    }
    document.getElementById('levelMenu').classList.remove('hidden');
}

function closeOverlay(id) { document.getElementById(id).classList.add('hidden'); }
function showMainMenu() {
    document.getElementById('winMenu').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
    gameRunning = false;
}

document.getElementById('btnLeft').ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
document.getElementById('btnLeft').ontouchend = (e) => { e.preventDefault(); keys.left = false; };
document.getElementById('btnRight').ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
document.getElementById('btnRight').ontouchend = (e) => { e.preventDefault(); keys.right = false; };
document.getElementById('btnJump').ontouchstart = (e) => { e.preventDefault(); keys.up = true; };
document.getElementById('btnJump').ontouchend = (e) => { e.preventDefault(); keys.up = false; };
document.getElementById('btnShoot').onclick = () => shoot();

window.onkeydown = e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === ' ') shoot();
};
window.onkeyup = e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
};

mainLoop();
