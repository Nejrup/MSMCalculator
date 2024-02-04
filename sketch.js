let inputs = {};
let innerLeafMass,
  outerLeafMass,
  innerLeafTL,
  outerLeafTL,
  insulatedCavityF0,
  emptyCavityF0;
let highlightedBarIndex = -1;
let graphWidth, graphHeight, frequencyRange, tlValues, paddingWidth, paddingTop;

// Add a variable to store the selected unit system (default is metric)
let unitSystem = "metric"; // "metric" or "imperial"

// Flag to check if recalculation is needed
let recalculate = true;

// Load saved input values from localStorage on page load
function loadSavedInputs() {
  Object.keys(inputs).forEach((key) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) {
      inputs[key].value(savedValue);
    }
  });
}

// Save input values to localStorage when inputs change
function saveInputsToLocalStorage() {
  Object.keys(inputs).forEach((key) => {
    localStorage.setItem(key, inputs[key].value());
  });
}

function setup() {
  inputs = {
    innerLeafDensity: createInput(""),
    innerLeafThickness: createInput(""),
    cavityDepth: createInput(""),
    outerLeafDensity: createInput(""),
    outerLeafThickness: createInput(""),
  };

  // Load saved input values
  loadSavedInputs();

  // Add a button to toggle between metric and imperial units
  let unitSystemButton = createButton(unitSystem);
  unitSystemButton.mousePressed(toggleUnits);
  unitSystemButton.id("unit-system-button");
  select("main").child(unitSystemButton);

  let inputContainer1 = createDiv("");
  inputContainer1.class("input-container1");
  inputContainer1.child(createElement("p", "Inner Leaf:"));
  inputContainer1.child(createElement("label", "Material Density (kg/m3)").id("innerLeafDensityLabel"));
  inputContainer1.child(inputs.innerLeafDensity);
  inputContainer1.child(createElement("label", "Thickness (mm)").id("innerLeafThicknessLabel"));
  inputContainer1.child(inputs.innerLeafThickness);
  inputContainer1.child(createDiv("").id("innerLeafMassLabel"));

  let inputContainer2 = createDiv("");
  inputContainer2.class("input-container2");
  inputContainer2.child(createElement("p", "Cavity:"));
  inputContainer2.child(createElement("label", "Cavity Depth (mm)").id("cavityDepthLabel"));
  inputContainer2.child(inputs.cavityDepth);

  let inputContainer3 = createDiv("");
  inputContainer3.class("input-container3");
  inputContainer3.child(createElement("p", "Outer Leaf:"));
  inputContainer3.child(createElement("label", "Material Density (kg/m3)").id("outerLeafDensityLabel"));
  inputContainer3.child(inputs.outerLeafDensity);
  inputContainer3.child(createElement("label", "Thickness (mm)").id("outerLeafThicknessLabel"));
  inputContainer3.child(inputs.outerLeafThickness);
  inputContainer3.child(createDiv("").id("outerLeafMassLabel"));


  let containerWrapper = createDiv("");
  containerWrapper.class("container-wrapper");

  containerWrapper.child(inputContainer1);
  containerWrapper.child(inputContainer2);
  containerWrapper.child(inputContainer3);

  let resultContainer = createDiv("");
  resultContainer.class("result-container");
  resultContainer.child(createElement("h3", "Results:"));
  resultContainer.child(createDiv("").id("innerLeafTLLabel"));
  resultContainer.child(createDiv("").id("outerLeafTLLabel"));
  resultContainer.child(createDiv("").id("insulatedCavityF0Label"));
  resultContainer.child(createDiv("").id("emptyCavityF0Label"));

  select("main").child(containerWrapper);
  select("main").child(resultContainer);

  Object.values(inputs).forEach((input) => input.input(handleInput));

  createCanvas(windowWidth, 450);
}

function handleInput() {
  // Set recalculate flag to true when inputs change
  recalculate = true;

  saveInputsToLocalStorage(); // Save inputs to localStorage

}

function toggleUnits() {
  // Toggle between metric and imperial units
  unitSystem = unitSystem === "metric" ? "imperial" : "metric";
  select("#unit-system-button").html(unitSystem);
  updateUnitLabels();
  convertInputValues();
  recalculate = true;
}

function updateUnitLabels() {
  // Update labels based on the selected unit system
  const densityLabelInner = unitSystem === "metric" ? "Density (kg/m3)" : "Density (lb/ft3)";
  const thicknessLabelInner = unitSystem === "metric" ? "Thickness (mm)" : "Thickness (in)";
  const cavityDepthLabel = unitSystem === "metric" ? "Cavity Depth (mm)" : "Cavity Depth (in)";

  const densityLabelOuter = unitSystem === "metric" ? "Density (kg/m3)" : "Density (lb/ft3)";
  const thicknessLabelOuter = unitSystem === "metric" ? "Thickness (mm)" : "Thickness (in)";

  // Update inner leaf labels
  select("#innerLeafDensityLabel").html(densityLabelInner);
  select("#innerLeafThicknessLabel").html(thicknessLabelInner);
  select("#cavityDepthLabel").html(cavityDepthLabel);

  // Update outer leaf labels separately
  select("#outerLeafDensityLabel").html(densityLabelOuter);
  select("#outerLeafThicknessLabel").html(thicknessLabelOuter);
}

function convertInputValues() {
  // Convert and update current input values based on the selected unit system
  inputs.innerLeafDensity.value(convertDensity(inputs.innerLeafDensity.value()));
  inputs.innerLeafThickness.value(convertThickness(inputs.innerLeafThickness.value()));
  inputs.cavityDepth.value(convertThickness(inputs.cavityDepth.value()));
  inputs.outerLeafDensity.value(convertDensity(inputs.outerLeafDensity.value()));
  inputs.outerLeafThickness.value(convertThickness(inputs.outerLeafThickness.value()));
}

function convertDensity(value) {
  return unitSystem === "metric" ? (value / 0.0624279606).toPrecision(4) : (value * 0.0624279606).toPrecision(4); // Convert kg/m3 to lb/ft3
}

function convertThickness(value) {
  return unitSystem === "metric" ? (value * 25.4).toPrecision(4) : (value / 25.4).toPrecision(4); // Convert mm to inches
}


function windowResized() {
  resizeCanvas(windowWidth, 450);
  recalculate = true;
}

function draw() {
  clear();
  // Only recalculate when needed
  if (recalculate) {
    calculate();
    recalculate = false;
  }
  drawGraph();
}


const maxTL = 80;
const minTL = 0;
function drawGraph() {
  highlightedBarIndex = -1;
  noStroke();

  for (let i = 0; i < frequencyRange.length; i++) {
    const x = map(i, 0, frequencyRange.length - 1, paddingWidth, graphWidth);
    const y = map(tlValues[i], minTL, maxTL, 0, graphHeight);
    const w = graphWidth / frequencyRange.length;

    if (
      mouseX > x &&
      mouseX < x + w - 1 &&
      mouseY > graphHeight - y + paddingTop * 2 &&
      mouseY < graphHeight + paddingTop
    ) {
      fill(255, 100, 100, 200);
      stroke(255, 100, 100);
      highlightedBarIndex = i;
    } else {
      fill(100, 150, 200, 180);
      noStroke();
    }

    rect(x, graphHeight + paddingTop, w, -Math.min(y, graphHeight), 10);

    if (i % Math.log10(10000) === 0) {
      fill(255);
      textAlign(RIGHT, BOTTOM);
      push();
      translate(x + w / 2 + 4, graphHeight + 30 + paddingTop);
      rotate(-PI / 3);

      const frequencyLabel =
        frequencyRange[i] <= 1000
          ? frequencyRange[i].toFixed(0) + " Hz"
          : (frequencyRange[i] / 1000).toFixed(2) + " kHz";

      text(frequencyLabel, 0, 0);
      pop();
    }
  }

  for (let i = 0; i <= 10; i++) {
    if (i % 1 === 0) {
      const y = map(i * 10, 0, 100, graphHeight, 0) + paddingTop;
      fill(255);
      textAlign(RIGHT, CENTER);
      text(
        (minTL + (i * maxTL) / 10).toFixed(0) + " dB",
        90,
        y
      );
      push();
      stroke(255, 255, 255, 80);
      line(paddingWidth, y, graphWidth, y);
      pop();
    }
  }

  fill(255);
  textAlign(CENTER, CENTER);
  text("Frequency (Hz)", width / 2, graphHeight + 90 + paddingTop);
  push();
  rotate(-PI / 2);
  text("Transmission Loss (dB)", -graphHeight / 2 - paddingTop, 30);
  pop();

  if (highlightedBarIndex !== -1) {
    const highlightedFrequency = frequencyRange[highlightedBarIndex].toFixed(0);
    const highlightedTL = tlValues[highlightedBarIndex].toFixed(2);

    const labelWidth = 120;
    const labelHeight = 50;
    const labelX = mouseX - labelWidth / 2;
    const labelY = mouseY - labelHeight - 6;

    fill(255, 240);
    noStroke();
    rect(labelX, labelY, labelWidth, labelHeight, 10);

    fill(0);
    textAlign(CENTER, CENTER);
    text(`Freq: ${highlightedFrequency} Hz`, mouseX, mouseY - 40);
    text(`TL: ${highlightedTL} dB`, mouseX, mouseY - 20);
  }
}



// Helper function to generate logarithmically spaced values
function logspace(start, end, count) {
  const exponentStep = (Math.log10(end) - Math.log10(start)) / (count - 1);
  return Array.from({ length: count }, (_, i) =>
    Math.pow(10, Math.log10(start) + i * exponentStep)
  );
}

function calculate() {
  // Calculate masses
  const innerLeafThicknessM = inputs.innerLeafThickness.value() / (unitSystem === "metric" ? 1000 : 1);
  const outerLeafThicknessM = inputs.outerLeafThickness.value() / (unitSystem === "metric" ? 1000 : 1);
  innerLeafMass = calculateMass(inputs.innerLeafDensity.value(), innerLeafThicknessM);
  outerLeafMass = calculateMass(inputs.outerLeafDensity.value(), outerLeafThicknessM);

  // Calculate Transmission Loss (TL)
  innerLeafTL = calculateTransmissionLoss(innerLeafMass);
  outerLeafTL = calculateTransmissionLoss(outerLeafMass);

  // Calculate Resonating Frequency (F0)
  const cavityDepthM = parseFloat(inputs.cavityDepth.value()) * 0.001;
  insulatedCavityF0 = calculateResonatingFrequency(innerLeafMass, outerLeafMass, cavityDepthM, true);
  emptyCavityF0 = calculateResonatingFrequency(innerLeafMass, outerLeafMass, cavityDepthM, false);

  // Update result labels
  updateResultLabel("#innerLeafMassLabel", innerLeafMass, "Inner");
  updateResultLabel("#outerLeafMassLabel", outerLeafMass, "Outer");
  updateTransmissionLossLabel("#innerLeafTLLabel", innerLeafTL, "Inner");
  updateTransmissionLossLabel("#outerLeafTLLabel", outerLeafTL, "Outer");
  updateFrequencyLabel("#insulatedCavityF0Label", insulatedCavityF0, "Insulated");
  updateFrequencyLabel("#emptyCavityF0Label", emptyCavityF0, "Empty");

  calculateGraphProperties();
}

function updateResultLabel(labelId, value, type) {
  select(labelId).html(`${type} Leaf Mass: <b>${value ? value.toFixed(2) : "N/A"} ${unitSystem === "metric" ? "kg/m2" : "lb/ft2"}</b>`);
}

function updateTransmissionLossLabel(labelId, value, type) {
  select(labelId).html(`${type} Leaf TL: <b>${value ? value.toFixed(2) : "N/A"} dB</b>`);
}

function updateFrequencyLabel(labelId, value, type) {
  select(labelId).html(`F0 ${type} Cavity: <b>${value ? value.toFixed(2) : "N/A"} Hz</b>`);
}

function calculateGraphProperties() {
  paddingWidth = 100;
  paddingTop = 30;
  graphWidth = width - paddingWidth;
  graphHeight = 300;
  frequencyRange = logspace(20, 20000, 101);
  tlValues = [];


  for (let i = 0; i < frequencyRange.length; i++) {
    const frequency = frequencyRange[i];
    const tl = calculateTransmissionLossAtFrequency(frequency, innerLeafMass, outerLeafMass, parseFloat(inputs.cavityDepth.value()) * 0.001);
    tlValues.push(tl);
  }
}

function calculateMass(density, thickness) {
  if (unitSystem === "metric") {
    return density * thickness; // Mass in kg
  } else if (unitSystem === "imperial") {
    density = density / 1.11485;
    return density * thickness; // Mass in lb
  }
}


function calculateResonatingFrequency(innerLeafMass, outerLeafMass, cavityDepthM, insulated) {
  if (unitSystem === "imperial") {
    innerLeafMass *= 0.45359237;
    outerLeafMass *= 0.45359237;
    cavityDepthM *= 25.4;
  }

  return calculateResonatingFrequencyMetric(innerLeafMass, outerLeafMass, cavityDepthM, insulated);
}

function calculateResonatingFrequencyMetric(innerLeafMass, outerLeafMass, cavityDepthM, insulated) {
  const constantC = insulated ? 43 : 60;
  const denominator = innerLeafMass * outerLeafMass * cavityDepthM;
  return constantC * Math.sqrt((innerLeafMass + outerLeafMass) / denominator);
}

function calculateTransmissionLoss(surfaceDensity) {
  surfaceDensity = unitSystem === "metric" ? surfaceDensity : surfaceDensity * 0.45359237;
  return calculateTransmissionLossMetric(surfaceDensity);
}

function calculateTransmissionLossMetric(surfaceDensity) {
  return 14.5 * Math.log10(surfaceDensity * 0.205) + 23;
}

function calculateTransmissionLossAtFrequency(
  frequency,
  innerLeafMass,
  outerLeafMass,
  cavityDepthM
) {
  if (unitSystem === "imperial") {
    innerLeafMass = innerLeafMass * 0.45359237;
    outerLeafMass = outerLeafMass * 0.45359237;
    cavityDepthM = cavityDepthM * 25.4;
  }

  const F0 = calculateResonatingFrequencyMetric(
    innerLeafMass,
    outerLeafMass,
    cavityDepthM,
    true
  );
  const F1 = 55 / cavityDepthM;

  if (frequency < F0) {
    return 20 * Math.log10(frequency * (innerLeafMass + outerLeafMass)) - 47;
  } else if (frequency >= F0 && frequency <= F1) {
    const R1 = 20 * Math.log10(frequency * innerLeafMass) - 47.2;
    const R2 = 20 * Math.log10(frequency * outerLeafMass) - 47.2;
    return R1 + R2 + 20 * Math.log10(frequency * cavityDepthM) - 29;
  } else {
    const R1 = 14.5 * Math.log10(innerLeafMass * 0.205) + 23;
    const R2 = 14.5 * Math.log10(outerLeafMass * 0.205) + 23;
    return R1 + R2 + 6;
  }
}
