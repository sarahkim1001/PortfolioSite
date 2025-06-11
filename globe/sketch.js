let cities = [
    { name: 'Delhi, India', lat: 28.7041, lon: 77.1025, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Kinshasa, DRC', lat: -4.4419, lon: 15.2663, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Lagos, Nigeria', lat: 6.5244, lon: 3.3792, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'New York, USA', lat: 40.7128, lon: -74.0060, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'London, UK', lat: 51.5074, lon: -0.1278, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' },
    { name: 'Beijing, China', lat: 39.9042, lon: 116.4074, pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0, theta: 0, phi: 0, error: false, source: '' }
  ];
  let mapImg;
  let font;
  let lastUpdate = 0;
  const updateInterval = 30000; // Update every 30 seconds
  const openWeatherApiKey = 'db503cd1a0fdc975daf17f0049fa9d6e';
  let rotationX = 0, rotationY = 0; // For orbit control
  let isDragging = false;
  let prevMouseX = 0, prevMouseY = 0;
  let zoom = 1;
  const globeRadius = 150;
  let selectedPollutant = 'pm25';
  
  function preload() {
    mapImg = loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/800px-Equirectangular_projection_SW.jpg', () => console.log('Texture loaded'), () => console.error('Texture failed to load'));
    font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Regular.otf');
  }
  
  function setup() {
    let canvas;
    try {
      let container = document.getElementById('canvas-container');
      if (container) {
        canvas = createCanvas(windowWidth * 0.8, windowHeight * 0.8, WEBGL);
        canvas.parent(container);
        console.log('Canvas created and parented');
      } else {
        console.error('Canvas container not found!');
        canvas = createCanvas(windowWidth * 0.8, windowHeight * 0.8, WEBGL);
      }
    } catch (e) {
      console.error('Canvas setup error:', e);
      canvas = createCanvas(windowWidth * 0.8, windowHeight * 0.8, WEBGL);
    }
    textFont(font);
    textSize(12);
    for (let city of cities) {
      city.theta = radians(90 - city.lat); // Polar angle (0 at north pole)
      city.phi = radians(city.lon); // Standard longitude
    }
    fetchData();
    document.querySelectorAll('input[name="pollutant"]').forEach(radio => {
      radio.addEventListener('change', (event) => {
        if (event.target.checked) {
          selectedPollutant = event.target.value;
          console.log('Selected pollutant:', selectedPollutant);
        }
      });
    });
  }
  
  function fetchData() {
    for (let city of cities) {
      let url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${openWeatherApiKey}`;
      loadJSON(url, (data) => gotData(data, city), (err) => errorData(err, city));
    }
  }
  
  function gotData(data, city) {
    console.log(`OpenWeather Data for ${city.name} at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}:`, data);
    if (data.list && data.list[0] && data.list[0].components) {
      city.pm25 = data.list[0].components.pm2_5 || 0;
      city.pm10 = data.list[0].components.pm10 || 0;
      city.no2 = data.list[0].components.no2 || 0;
      city.so2 = data.list[0].components.so2 || 0;
      city.co = data.list[0].components.co || 0;
      city.o3 = data.list[0].components.o3 || 0;
      city.error = false;
      city.source = 'OpenWeather';
    } else {
      errorData(null, city);
    }
  }
  
  function errorData(err, city) {
    console.error(`API Error for ${city.name}:`, err);
    city.error = true;
    city.source = 'Fallback';
    city.pm25 = city.name.includes('Delhi') ? 102.1 : city.name.includes('Beijing') ? 85.3 : 0;
    city.pm10 = city.name.includes('Delhi') ? 200.5 : city.name.includes('Beijing') ? 150.2 : 0;
    city.no2 = city.name.includes('Delhi') ? 45.7 : city.name.includes('London') ? 35.4 : 0;
    city.so2 = city.name.includes('Delhi') ? 15.2 : city.name.includes('Beijing') ? 12.8 : 0;
    city.co = city.name.includes('Delhi') ? 1200 : city.name.includes('Tokyo') ? 800 : 0;
    city.o3 = city.name.includes('Delhi') ? 60.3 : city.name.includes('Sydney') ? 45.1 : 0;
  }
  
  function draw() {
    background(0); // Black space background
    if (!mapImg) {
      fill(255);
      textAlign(CENTER);
      text('Loading texture...', width / 2, height / 2);
      return;
    }
    camera(0, 0, (height / 2) / tan(PI / 6) * zoom, 0, 0, 0, 0, 1, 0);
    ambientLight(150); // Brighter ambient light
    pointLight(255, 255, 255, 0, 0, 300); // Stronger point light
  
    push();
    rotateX(rotationX);
    rotateY(rotationY);
    noStroke();
    tint(200); // Brighter globe
    texture(mapImg);
    // rotateY(radians(180)); // Uncomment to flip texture if needed
    sphere(globeRadius, 24, 24);
    pop();
  
    for (let city of cities) {
      let value = city[selectedPollutant] || 0;
      if (value > 0) {
        let color = city.error ? [100, 100, 100, 150] :
                    value > 35 ? [255, 0, 0, 150] :
                    value > 5 ? [255, 255, 0, 150] :
                    [0, 150, 100, 150];
        let size = constrain(value * 0.15, 2, 15);
        let scale = 1 + 0.2 * sin(frameCount * 0.05);
        let r = globeRadius;
  
        // Calculate initial position
        let x = r * sin(city.theta) * cos(city.phi);
        let y = r * cos(city.theta);
        let z = r * sin(city.theta) * sin(city.phi);
  
        push();
        rotateX(rotationX);
        rotateY(rotationY);
        translate(x, y, z);
        fill(color);
        noStroke();
        sphere(size * scale, 8, 8);
        pop();
  
        console.log(`City: ${city.name}, lat: ${city.lat}, lon: ${city.lon}, theta: ${city.theta}, phi: ${city.phi}, x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)} at ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
  
        let screenPos = screenPosition(x, y, z);
        let d = dist(mouseX - width / 2, mouseY - height / 2, screenPos.x, screenPos.y);
        if (d < size * scale * 20) {
          push();
          resetMatrix();
          textAlign(CENTER);
          textSize(12);
          fill(255);
          let impact = city.error ? `No data (using ${city.source})` :
                      value > 35 ? 'High risk: Health issues' :
                      value > 5 ? 'Moderate risk' : 'Low risk';
          text(`${city.name}: ${value.toFixed(2)} µg/m³\n${selectedPollutant.toUpperCase()}\n${impact}`, width / 2, height - 50);
          pop();
        }
      }
    }
  
    push();
    resetMatrix();
    textAlign(CENTER);
    textSize(20);
    fill(255);
    text('Pollutant Disparities Globe', width / 2, 30);
    textSize(12);
    text('Drag to rotate | Scroll to zoom | Select one pollutant', width / 2, 50);
    pop();
  
    if (millis() - lastUpdate > updateInterval) {
      fetchData();
      lastUpdate = millis();
    }
  }
  
  function screenPosition(x, y, z) {
    let fov = PI / 3;
    let cameraZ = (height / 2) / tan(fov / 2) * zoom;
    let scale = cameraZ / (cameraZ + z);
    return { x: x * scale + width / 2, y: y * scale + height / 2 };
  }
  
  function mousePressed() {
    isDragging = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
  
  function mouseDragged() {
    if (isDragging) {
      let dx = mouseX - prevMouseX;
      let dy = mouseY - prevMouseY;
      rotationY += dx * 0.01;
      rotationX += dy * 0.01;
      rotationX = constrain(rotationX, -PI / 2, PI / 2); // Limit vertical rotation
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }
  }
  
  function mouseReleased() {
    isDragging = false;
  }
  
  function mouseWheel(event) {
    zoom += event.delta * -0.001;
    zoom = constrain(zoom, 0.5, 2);
  }
  
  function windowResized() {
    resizeCanvas(windowWidth * 0.8, windowHeight * 0.8);
  }