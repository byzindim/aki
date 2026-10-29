// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    showDelay: 10000,
    waveInterval: 25000,
    bubbleDuration: 5000,
    catalogUrl: 'https://highway77.ru/catalog/catalog.php',
    newUrl: 'https://highway77.ru/#new-arrivals',
    whatsappUrl: 'https://wa.me/79137173840',
    telegramUrl: 'https://t.me/+79137173840'
};

// ===== КАТЕГОРИИ ДЕТАЛЕЙ =====
const CATEGORIES = {
    engine:    { name: 'Детали двигателя',          icon: 'fa-cog',        color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=engine',    position: { x: 1.2,  y: 0.3,  z: 0.5 } },
    cooling:   { name: 'Система охлаждения',        icon: 'fa-snowflake',  color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=cooling',   position: { x: 1.8,  y: 0.2,  z: 0.8 } },
    suspension:{ name: 'Подвеска',                  icon: 'fa-compress-arrows-alt', color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=suspension', position: { x: -1.0, y: -0.6, z: 0.8 } },
    fuel:      { name: 'Топливная система',         icon: 'fa-gas-pump',    color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=fuel',      position: { x: -1.5, y: 0.1,  z: 0.2 } },
    climate:   { name: 'Климат-контроль',           icon: 'fa-thermometer-half', color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=climate', position: { x: 0.2,  y: 0.5,  z: 0.3 } },
    exhaust:   { name: 'Выхлопная система',         icon: 'fa-wind',        color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=exhaust',   position: { x: -1.8, y: -0.3, z: 0 } },
    steering:  { name: 'Рулевое управление',        icon: 'fa-crosshairs',  color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=steering',  position: { x: 1.5,  y: -0.2, z: 0.7 } },
    electric:  { name: 'Электрика',                 icon: 'fa-bolt',        color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=electric',  position: { x: 0.8,  y: 0.4,  z: 0.4 } },
    body:      { name: 'Кузов',                     icon: 'fa-car',         color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=body',      position: { x: 0,    y: 0.9,  z: 0 } },
    brakes:    { name: 'Ходовая часть и тормоза',   icon: 'fa-circle',      color: '#FF0000', url: 'https://highway77.ru/catalog/catalog.php?cat=brakes',    position: { x: -1.0, y: -0.7, z: -0.8 } }
};

// ===== THREE.JS ПЕРЕМЕННЫЕ =====
let characterScene, characterCamera, characterRenderer, characterMesh;
let carScene, carCamera, carRenderer, carModel, carControls;
let carHotspots = [];
let carRaycaster, carMouse;
let hoveredHotspot = null;
let isMenuOpen = false;
let widgetShown = false;
let car3DInitialized = false;

// ===== ИНИЦИАЛИЗАЦИЯ 3D ПЕРСОНАЖА =====
function initCharacter3D() {
    const canvas = document.getElementById('aki-canvas');
    if (!canvas) {
        console.error('Canvas not found for character');
        return;
    }

    characterScene = new THREE.Scene();
    
    characterCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    characterCamera.position.z = 3;
    
    characterRenderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true, 
        alpha: true 
    });
    characterRenderer.setSize(120, 120);
    characterRenderer.setPixelRatio(window.devicePixelRatio);
    characterRenderer.setClearColor(0x000000, 0);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    characterScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    characterScene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 3, 5);
    characterScene.add(pointLight);
    
    // Пробуем загрузить user.glb
    loadUserModel();
    
    animateCharacter();
}

function loadUserModel() {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'user.glb',
        function(gltf) {
            console.log('User model loaded successfully');
            
            if (characterMesh) {
                characterScene.remove(characterMesh);
            }
            
            characterMesh = gltf.scene;
            
            // Центрируем и масштабируем
            const box = new THREE.Box3().setFromObject(characterMesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            characterMesh.scale.setScalar(scale);
            
            characterMesh.position.y = -0.5;
            characterMesh.rotation.y = Math.PI;
            
            characterScene.add(characterMesh);
        },
        function(xhr) {
            // Progress
            if (xhr.lengthComputable) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log('User model loading: ' + Math.round(percentComplete) + '%');
            }
        },
        function(error) {
            console.error('Error loading user.glb:', error);
            console.log('Using fallback sphere instead');
            createFallbackCharacter();
        }
    );
}

function createFallbackCharacter() {
    // Создаем желтую сферу как fallback
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xffcc00,
        shininess: 100,
        emissive: 0xffaa00,
        emissiveIntensity: 0.2
    });
    characterMesh = new THREE.Mesh(geometry, material);
    characterScene.add(characterMesh);
    
    // Добавляем "глаза"
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.1, 0.7);
    characterMesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.1, 0.7);
    characterMesh.add(rightEye);
}

function animateCharacter() {
    requestAnimationFrame(animateCharacter);
    
    if (characterMesh) {
        characterMesh.rotation.y += 0.005;
    }
    
    if (characterRenderer && characterScene && characterCamera) {
        characterRenderer.render(characterScene, characterCamera);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ 3D МОДЕЛИ АВТО =====
function initCar3D() {
    if (car3DInitialized) {
        console.log('Car 3D already initialized');
        return;
    }
    
    const canvas = document.getElementById('car-canvas');
    const container = document.getElementById('akiCar3D');
    
    if (!canvas || !container) {
        console.error('Canvas or container not found');
        return;
    }
    
    console.log('Initializing car 3D...');
    
    carScene = new THREE.Scene();
    carScene.background = new THREE.Color(0xf5f5f5);
    
    carCamera = new THREE.PerspectiveCamera(
        45, 
        container.clientWidth / container.clientHeight, 
        0.1, 
        1000
    );
    carCamera.position.set(3, 2, 3);
    
    carRenderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true 
    });
    carRenderer.setSize(container.clientWidth, container.clientHeight);
    carRenderer.setPixelRatio(window.devicePixelRatio);
    carRenderer.shadowMap.enabled = true;
    carRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Controls
    carControls = new THREE.OrbitControls(carCamera, canvas);
    carControls.enableDamping = true;
    carControls.dampingFactor = 0.05;
    carControls.minDistance = 2;
    carControls.maxDistance = 10;
    carControls.target.set(0, 0, 0);
    
    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    carScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    carScene.add(directionalLight);
    
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    carScene.add(hemisphereLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 0, -5);
    carScene.add(fillLight);
    
    // Raycaster
    carRaycaster = new THREE.Raycaster();
    carMouse = new THREE.Vector2();
    
    // Загружаем модель
    loadCarModel();
    
    // Анимация
    animateCar();
    
    // Event listeners
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onWindowResize);
    
    car3DInitialized = true;
    console.log('Car 3D initialized');
}

function loadCarModel() {
    const loader = new THREE.GLTFLoader();
    
    console.log('Loading car.glb...');
    
    loader.load(
        'car.glb',
        function(gltf) {
            console.log('Car model loaded successfully!', gltf);
            
            if (carModel) {
                carScene.remove(carModel);
            }
            
            carModel = gltf.scene;
            
            // Настраиваем тени
            carModel.traverse(function(object) {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    
                    // Если есть материал, делаем его немного ярче
                    if (object.material) {
                        object.material.needsUpdate = true;
                    }
                }
            });
            
            // Автомасштабирование
            const box = new THREE.Box3().setFromObject(carModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            carModel.scale.setScalar(scale);
            
            // Центрируем
            carModel.position.x = -center.x * scale;
            carModel.position.y = -0.5;
            carModel.position.z = -center.z * scale;
            
            // Поворот
            carModel.rotation.y = -Math.PI / 4;
            
            carScene.add(carModel);
            
            // Создаем хотспоты
            createHotspots();
            
            console.log('Car model added to scene with scale:', scale);
        },
        function(xhr) {
            if (xhr.lengthComputable) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log('Car model loading: ' + Math.round(percentComplete) + '%');
            }
        },
        function(error) {
            console.error('Error loading car.glb:', error);
            console.error('Error details:', error.message);
            alert('Ошибка загрузки 3D модели. Проверьте консоль.');
        }
    );
}

function createHotspots() {
    // Удаляем старые хотспоты
    carHotspots.forEach(h => {
        if (h.mesh && h.mesh.parent) {
            h.mesh.parent.remove(h.mesh);
        }
    });
    carHotspots = [];
    
    // Создаем новые
    Object.keys(CATEGORIES).forEach(key => {
        const category = CATEGORIES[key];
        const hotspot = createHotspot(category.position, key);
        carHotspots.push(hotspot);
        carScene.add(hotspot.mesh);
    });
    
    console.log('Created', carHotspots.length, 'hotspots');
}

function createHotspot(position, categoryKey) {
    // Основная сфера
    const geometry = new THREE.SphereGeometry(0.08, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.9,
        shininess: 100
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    sphere.userData = { category: categoryKey };
    
    // Пульсирующее кольцо
    const pulseGeometry = new THREE.RingGeometry(0.1, 0.15, 32);
    const pulseMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulse.rotation.x = Math.PI / 2;
    sphere.add(pulse);
    
    // Добавляем свечение
    const glowGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glow);
    
    return { 
        mesh: sphere, 
        pulse: pulse,
        glow: glow,
        originalScale: 1 
    };
}

function animateCar() {
    requestAnimationFrame(animateCar);
    
    // Анимация пульсации хотспотов
    const time = Date.now() * 0.003;
    carHotspots.forEach(hotspot => {
        if (hotspot.pulse) {
            const scale = 1 + Math.sin(time) * 0.3;
            hotspot.pulse.scale.setScalar(scale);
            hotspot.pulse.material.opacity = 0.4 + Math.sin(time) * 0.2;
        }
        if (hotspot.glow) {
            hotspot.glow.material.opacity = 0.2 + Math.sin(time) * 0.1;
        }
    });
    
    // Hover эффект
    if (hoveredHotspot) {
        const targetScale = 1.5;
        hoveredHotspot.mesh.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale), 
            0.1
        );
    } else {
        carHotspots.forEach(hotspot => {
            hotspot.mesh.scale.lerp(
                new THREE.Vector3(1, 1, 1), 
                0.1
            );
        });
    }
    
    // Вращение модели (опционально)
    if (carModel && !isMenuOpen) {
        // carModel.rotation.y += 0.001;
    }
    
    if (carControls) {
        carControls.update();
    }
    
    if (carRenderer && carScene && carCamera) {
        carRenderer.render(carScene, carCamera);
    }
}

function onMouseMove(event) {
    const canvas = document.getElementById('car-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    carMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    carMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    carRaycaster.setFromCamera(carMouse, carCamera);
    
    const hotspotMeshes = carHotspots.map(h => h.mesh);
    const intersects = carRaycaster.intersectObjects(hotspotMeshes, true);
    
    const tooltip = document.getElementById('hotspotTooltip');
    
    if (intersects.length > 0) {
        // Находим ближайший хотспот
        let foundHotspot = null;
        let object = intersects[0].object;
        
        while (object.parent && object.parent !== carScene) {
            object = object.parent;
        }
        
        foundHotspot = carHotspots.find(h => h.mesh === object);
        
        if (foundHotspot) {
            hoveredHotspot = foundHotspot;
            canvas.style.cursor = 'pointer';
            
            // Показываем tooltip
            const vector = new THREE.Vector3();
            foundHotspot.mesh.getWorldPosition(vector);
            vector.project(carCamera);
            
            const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
            const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;
            
            if (tooltip) {
                tooltip.style.left = x + 'px';
                tooltip.style.top = (y - 40) + 'px';
                tooltip.textContent = CATEGORIES[foundHotspot.userData.category].name;
                tooltip.classList.add('visible');
            }
        }
    } else {
        hoveredHotspot = null;
        canvas.style.cursor = 'default';
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
}

function onMouseLeave() {
    hoveredHotspot = null;
    const canvas = document.getElementById('car-canvas');
    if (canvas) {
        canvas.style.cursor = 'default';
    }
    const tooltip = document.getElementById('hotspotTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

function onClick() {
    if (hoveredHotspot) {
        const category = CATEGORIES[hoveredHotspot.userData.category];
        console.log('Clicked on category:', category);
        window.location.href = category.url;
    }
}

function onWindowResize() {
    const container = document.getElementById('akiCar3D');
    const canvas = document.getElementById('car-canvas');
    
    if (!container || !canvas) return;
    
    carCamera.aspect = container.clientWidth / container.clientHeight;
    carCamera.updateProjectionMatrix();
    carRenderer.setSize(container.clientWidth, container.clientHeight);
}

// ===== ЛОГИКА ВИДЖЕТА =====
function initWidget() {
    console.log('Initializing widget...');
    
    // Показываем виджет
    setTimeout(() => {
        const widget = document.getElementById('akiWidget');
        if (widget) {
            widget.style.opacity = '1';
            widgetShown = true;
            console.log('Widget shown');
            
            // Показываем облачко
            setTimeout(() => {
                const bubble = document.getElementById('akiBubble');
                if (bubble) {
                    bubble.classList.add('visible');
                    setTimeout(() => {
                        bubble.classList.remove('visible');
                    }, CONFIG.bubbleDuration);
                }
            }, 2000);
        }
    }, CONFIG.showDelay);
    
    // Инициализация персонажа
    initCharacter3D();
    
    // Скрываем виджет изначально
    const widget = document.getElementById('akiWidget');
    if (widget) {
        widget.style.opacity = '0';
        widget.style.transition = 'opacity 0.5s';
    }
    
    // Event listeners
    const character = document.getElementById('akiCharacter');
    if (character) {
        character.addEventListener('click', () => {
            toggleMenu();
            const badge = document.getElementById('akiBadge');
            if (badge) badge.classList.add('hidden');
        });
    }
    
    const menuClose = document.getElementById('akiMenuClose');
    if (menuClose) {
        menuClose.addEventListener('click', hideMenu);
    }
    
    document.addEventListener('click', (e) => {
        const widget = document.getElementById('akiWidget');
        if (widget && !widget.contains(e.target) && isMenuOpen) {
            hideMenu();
        }
    });
    
    // Периодическое приветствие
    setInterval(() => {
        if (!isMenuOpen && widgetShown) {
            const character = document.getElementById('akiCharacter');
            if (character) {
                character.classList.add('wave');
                setTimeout(() => {
                    character.classList.remove('wave');
                }, 600);
            }
        }
    }, CONFIG.waveInterval);
    
    // Реакция на уход
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 0 && !isMenuOpen && widgetShown) {
            const character = document.getElementById('akiCharacter');
            if (character) {
                character.classList.add('jump');
                
                const bubble = document.getElementById('akiBubble');
                if (bubble) {
                    bubble.innerHTML = 'Подождите! Подберём запчасти за 5 минут 🚗';
                    bubble.classList.add('visible');
                    
                    setTimeout(() => {
                        character.classList.remove('jump');
                        bubble.classList.remove('visible');
                        bubble.innerHTML = 'Привет! Я АКИ <br>Помогу с запчастями';
                    }, 3000);
                }
            }
        }
    });
    
    // Модальные окна
    const discountModal = document.getElementById('discountModal');
    if (discountModal) {
        discountModal.addEventListener('click', (e) => {
            if (e.target.id === 'discountModal') closeDiscountModal();
        });
    }
    
    const callbackModal = document.getElementById('callbackModal');
    if (callbackModal) {
        callbackModal.addEventListener('click', (e) => {
            if (e.target.id === 'callbackModal') closeCallbackModal();
        });
    }
    
    console.log('Widget initialization complete');
}

function toggleMenu() {
    const menu = document.getElementById('akiMenu');
    const car3d = document.getElementById('akiCar3D');
    
    if (isMenuOpen) {
        hideMenu();
    } else {
        if (menu) menu.classList.add('visible');
        if (car3d) car3d.classList.remove('visible');
        isMenuOpen = true;
        const character = document.getElementById('akiCharacter');
        if (character) character.classList.remove('pulse');
    }
}

function hideMenu() {
    const menu = document.getElementById('akiMenu');
    const car3d = document.getElementById('akiCar3D');
    
    if (menu) menu.classList.remove('visible');
    if (car3d) car3d.classList.remove('visible');
    isMenuOpen = false;
    const character = document.getElementById('akiCharacter');
    if (character) character.classList.add('pulse');
}

// ===== ФУНКЦИИ КНОПОК =====
function showCar3D() {
    const menu = document.getElementById('akiMenu');
    const car3d = document.getElementById('akiCar3D');
    
    if (menu) menu.classList.remove('visible');
    if (car3d) {
        car3d.classList.add('visible');
        // Инициализируем если еще не инициализировано
        if (!car3DInitialized) {
            setTimeout(() => initCar3D(), 100);
        }
    }
}

function hideCar3D() {
    const car3d = document.getElementById('akiCar3D');
    const menu = document.getElementById('akiMenu');
    
    if (car3d) car3d.classList.remove('visible');
    if (menu) menu.classList.add('visible');
}

function goToCatalog() {
    window.location.href = CONFIG.catalogUrl;
}

function goToNew() {
    const newSection = document.querySelector('.new-arrivals');
    if (newSection && window.location.hostname === 'highway77.ru') {
        newSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = CONFIG.newUrl;
    }
}

function showDiscountModal() {
    const modal = document.getElementById('discountModal');
    if (modal) {
        modal.classList.add('visible');
        hideMenu();
    }
}

function closeDiscountModal() {
    const modal = document.getElementById('discountModal');
    if (modal) modal.classList.remove('visible');
}

function submitDiscount() {
    const name = document.getElementById('discountName');
    const phone = document.getElementById('discountPhone');
    
    if (name && phone && name.value && phone.value) {
        alert('Спасибо! Промокод на скидку 15% отправлен на ' + phone.value);
        closeDiscountModal();
        // Здесь можно добавить отправку на сервер
    } else {
        alert('Пожалуйста, заполните все поля');
    }
}

function showCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (modal) {
        modal.classList.add('visible');
        hideMenu();
    }
}

function closeCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (modal) modal.classList.remove('visible');
}

function submitCallback() {
    const name = document.getElementById('callbackName');
    const phone = document.getElementById('callbackPhone');
    
    if (name && phone && name.value && phone.value) {
        alert('Спасибо! Мы перезвоним вам на ' + phone.value + ' в ближайшее время');
        closeCallbackModal();
        // Здесь можно добавить отправку на сервер
    } else {
        alert('Пожалуйста, заполните все поля');
    }
}

function openWhatsApp() {
    window.open(CONFIG.whatsappUrl, '_blank');
}

function openTelegram() {
    window.open(CONFIG.telegramUrl, '_blank');
}

// ===== ЗАПУСК =====
window.addEventListener('load', initWidget);