document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const select = document.getElementById("codingSelect");
    const inputField = document.getElementById("binaryInput");
    const runButton = document.getElementById("runAnimation");
    const errorMsg = document.getElementById("errorMsg");
    const infoBox = document.getElementById("infoBox");
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;
    let currentAnim = 0; // To cancel previous animations
    let currentUnitWidth = 50; // Default value; updated each time based on binaryData length.
    let binaryDataLength = 1;  // Default (to avoid division by zero)
  
    // Technique Information for the Info Box
    const techniqueInfo = {
      "unipolar": {
        title: "Unipolar Encoding",
        description: "Uses a single polarity for '1' (positive voltage) and zero voltage for '0'. It's simple but may have synchronization issues."
      },
      "nrzl": {
        title: "NRZ‑L (Non‑Return‑to‑Zero Level)",
        description: "Assigns one voltage level for '1' and another for '0'. It is simple, but long sequences of identical bits can cause synchronization issues."
      },
      "nrzi": {
        title: "NRZ‑I (Non‑Return‑to‑Zero Inverted)",
        description: "Toggles the signal level when a '1' is encountered. It is less sensitive to long strings of identical bits compared to NRZ‑L."
      },
      "manchester": {
        title: "Manchester Encoding",
        description: "Splits each bit period into two halves with a transition in the middle. This self-clocking method improves synchronization."
      },
      "dmanchester": {
        title: "Differential Manchester Encoding",
        description: "Always has a mid-bit transition. The decision is based on the presence or absence of a transition at the beginning of the bit period, enhancing robustness."
      },
      "ami": {
        title: "AMI (Alternate Mark Inversion)",
        description: "Alternates the polarity for successive '1's while '0's are zero. This technique helps maintain DC balance and supports error detection."
      },
      "pseudoternary": {
        title: "Pseudoternary Encoding",
        description: "Reverses the role of AMI: '0's alternate in polarity while '1's remain at zero voltage, assisting in clock recovery."
      },
      "hdb3": {
        title: "HDB3 (High‑Density Bipolar 3 Zeros)",
        description: "A modified bipolar encoding that replaces sequences of four zeros with a violation pulse to ensure synchronization and DC balance."
      }
    };
  
    // Clear the canvas
    function clearCanvas() {
      ctx.clearRect(0, 0, width, height);
      drawAxes(); // Ensure axes are drawn after clearing
  }
  
  
    // Draw a line segment with a short delay
    function drawSmoothLine(x1, y1, x2, y2, callback, animId) {
      let progress = 0;
      ctx.strokeStyle = "#000000";  
      ctx.lineWidth = 2;  // Make the waveform thicker for visibility
      
      function animate() {
          if (progress >= 1 || animId !== currentAnim) {
              if (callback) callback();
              return;
          }
  
          let newX = x1 + (x2 - x1) * progress;
          let newY = y1 + (y2 - y1) * progress;
  
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(newX, newY);
          ctx.stroke();
  
          progress += 0.05;
          requestAnimationFrame(animate);
      }
      animate();
  }
  
    
    // ADD THIS LINE to alias drawLine to your smooth version:
    const drawLine = drawSmoothLine;
    
  
  
    // Animate drawing one bit at a time
    function animateDrawing(drawFunction, binaryData, animId) {
      clearCanvas();
      let index = 0;
      function step() {
        if (index < binaryData.length && animId === currentAnim) {
          drawFunction(binaryData, index, () => {
            index++;
            step();
          }, animId);
        }
      }
      step();
    }
  
    // --- HELPER FUNCTIONS FOR NRZ‑I ---
    function getNRZIStateBefore(binaryData, index) {
      let state = midY + 50; // initial state for NRZ‑I
      for (let i = 0; i < index; i++) {
        if (binaryData[i] === "1") {
          state = (state === midY + 50) ? midY - 50 : midY + 50;
        }
      }
      return state;
    }
    function getNRZIStateAt(binaryData, index) {
      let state = midY + 50;
      for (let i = 0; i <= index; i++) {
        if (binaryData[i] === "1") {
          state = (state === midY + 50) ? midY - 50 : midY + 50;
        }
      }
      return state;
    }
  
    // --- LINE CODING FUNCTIONS ---
  
    // Unipolar Encoding
    function drawUnipolar(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let y = binaryData[index] === "1" ? midY - 50 : midY;
      let prevY = index > 0 ? (binaryData[index - 1] === "1" ? midY - 50 : midY) : y;
      drawLine(x, prevY, x, y, () =>
          drawLine(x, y, x + unitWidth, y, callback, animId), animId);
  }
  
  
  
    // NRZ‑L
    function drawNRZL(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let y = binaryData[index] === "1" ? midY - 50 : midY + 50;
      let prevY = index > 0 ? (binaryData[index - 1] === "1" ? midY - 50 : midY + 50) : midY;
      drawLine(x, prevY, x, y, () =>
          drawLine(x, y, x + unitWidth, y, callback, animId), animId);
  }
  
  
  
    // NRZ‑I
    function drawNRZI(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let prevState = getNRZIStateBefore(binaryData, index);
      let currState = getNRZIStateAt(binaryData, index);
      drawLine(x, prevState, x, currState, () =>
          drawLine(x, currState, x + unitWidth, currState, callback, animId), animId);
  }
  
  
  
    // Manchester Encoding
    function drawManchester(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      const high = midY - 50;
      const low = midY + 50;
      if (binaryData[index] === "1") {
          // For a '1': first half at high level, then vertical drop to low.
          drawLine(x, high, x + unitWidth / 2, high, () => {
              drawLine(x + unitWidth / 2, high, x + unitWidth / 2, low, () => {
                  drawLine(x + unitWidth / 2, low, x + unitWidth, low, callback, animId);
              }, animId);
          }, animId);
      } else {
          // For a '0': first half at low level, then vertical rise to high.
          drawLine(x, low, x + unitWidth / 2, low, () => {
              drawLine(x + unitWidth / 2, low, x + unitWidth / 2, high, () => {
                  drawLine(x + unitWidth / 2, high, x + unitWidth, high, callback, animId);
              }, animId);
          }, animId);
      }
  }
  
  
  
  
    // Differential Manchester Encoding
    function drawDifferentialManchester(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let startState = midY - 50; // initial state
      for (let i = 0; i < index; i++) {
          if (binaryData[i] === "0") {
              startState = (startState === midY - 50) ? midY + 50 : midY - 50;
          }
          // Always toggle at mid-bit.
          startState = (startState === midY - 50) ? midY + 50 : midY - 50;
      }
      let firstHalfState = startState;
      if (binaryData[index] === "0") {
          firstHalfState = (firstHalfState === midY - 50) ? midY + 50 : midY - 50;
      }
      let secondHalfState = (firstHalfState === midY - 50) ? midY + 50 : midY - 50;
      drawLine(x, startState, x, firstHalfState, () =>
          drawLine(x, firstHalfState, x + unitWidth / 2, firstHalfState, () =>
              drawLine(x + unitWidth / 2, firstHalfState, x + unitWidth / 2, secondHalfState, () =>
                  drawLine(x + unitWidth / 2, secondHalfState, x + unitWidth, secondHalfState, callback, animId)
              , animId)
          , animId)
      , animId);
  }
  
  
  
    // AMI
    function drawAMI(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let onesCount = 0;
      for (let i = 0; i <= index; i++) {
          if (binaryData[i] === "1") onesCount++;
      }
      let y = binaryData[index] === "1" ? (onesCount % 2 === 1 ? midY - 50 : midY + 50) : midY;
      let prevY = midY;
      if (index > 0) {
          onesCount = 0;
          for (let i = 0; i < index; i++) {
              if (binaryData[i] === "1") onesCount++;
          }
          prevY = binaryData[index - 1] === "1" ? (onesCount % 2 === 1 ? midY - 50 : midY + 50) : midY;
      }
      drawLine(x, prevY, x, y, () =>
          drawLine(x, y, x + unitWidth, y, callback, animId), animId);
  }
  
  
  
    // Pseudoternary
    function drawPseudoternary(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let zerosCount = 0;
      if (binaryData[index] === "0") {
          for (let i = 0; i <= index; i++) {
              if (binaryData[i] === "0") zerosCount++;
          }
      }
      let y = binaryData[index] === "0" ? (zerosCount % 2 === 1 ? midY - 50 : midY + 50) : midY;
      let prevY = midY;
      if (index > 0) {
          zerosCount = 0;
          for (let i = 0; i < index; i++) {
              if (binaryData[i] === "0") zerosCount++;
          }
          prevY = binaryData[index - 1] === "0" ? (zerosCount % 2 === 1 ? midY - 50 : midY + 50) : midY;
      }
      drawLine(x, prevY, x, y, () =>
          drawLine(x, y, x + unitWidth, y, callback, animId), animId);
  }
  
  
  
    // HDB3 (Simplified)
    function drawHDB3(binaryData, index, callback, animId) {
      const leftMargin = 30;
      const unitWidth = currentUnitWidth;
      let x = leftMargin + index * unitWidth;
      let y = midY;
      if (binaryData[index] === "1") {
          let onesCount = 0;
          for (let i = 0; i <= index; i++) {
              if (binaryData[i] === "1") onesCount++;
          }
          y = (onesCount % 2 === 1) ? midY - 50 : midY + 50;
      } else {
          if (index >= 3 && binaryData.slice(index - 3, index + 1) === "0000") {
              let onesCount = 0;
              for (let i = 0; i < index; i++) {
                  if (binaryData[i] === "1") onesCount++;
              }
              y = (onesCount % 2 === 1) ? midY + 50 : midY - 50;
          }
      }
      let prevY = midY;
      if (index > 0) {
          if (binaryData[index - 1] === "1") {
              let onesCount = 0;
              for (let i = 0; i < index; i++) {
                  if (binaryData[i] === "1") onesCount++;
              }
              prevY = (onesCount % 2 === 1) ? midY - 50 : midY + 50;
          } else {
              prevY = midY;
          }
      }
      drawLine(x, prevY, x, y, () =>
          drawLine(x, y, x + unitWidth, y, callback, animId), animId);
  }
  
  
  
    // --- Update Info Box ---
    function updateInfoBox(techniqueKey) {
      const info = techniqueInfo[techniqueKey];
      if (info) {
        infoBox.innerHTML = `<h3>${info.title}</h3><p>${info.description}</p>`;
        infoBox.classList.remove("visible");
        setTimeout(() => {
          infoBox.classList.add("visible");
        }, 50);
      } else {
        infoBox.innerHTML = "";
        infoBox.classList.remove("visible");
      }
    }
  
    // --- Update function: validate input, run animation, and update info ---
    function update() {
      const leftMargin = 30;
      const rightMargin = 10;
      binaryDataLength = binaryData.length;
      currentUnitWidth = (width - (leftMargin + rightMargin)) / binaryDataLength;
      currentAnim++; // Cancel ongoing animations
      const binaryData = inputField.value.trim();
      if (!/^[01]+$/.test(binaryData) || binaryData === "") {
          errorMsg.textContent = "Invalid input! Please enter only 0s and 1s.";
          infoBox.innerHTML = "";
          infoBox.classList.remove("visible");
          return;
      } else {
          errorMsg.textContent = "";
      }
      
      // Set grid parameters based on the length of binary data.
      binaryDataLength = binaryData.length;
      currentUnitWidth = (width - 40) / binaryDataLength; // 30 (left margin) + 10 (right margin) = 40
      
      clearCanvas();
      const techniques = {
          "unipolar": drawUnipolar,
          "nrzl": drawNRZL,
          "nrzi": drawNRZI,
          "manchester": drawManchester,
          "dmanchester": drawDifferentialManchester,
          "ami": drawAMI,
          "pseudoternary": drawPseudoternary,
          "hdb3": drawHDB3
      };
      
      updateInfoBox(select.value);
      if (techniques[select.value]) {
          animateDrawing(techniques[select.value], binaryData, currentAnim);
      }
  }
  

  function drawAxes() {
    const leftMargin = 30;
    const rightMargin = 10;
    const topMargin = 20;
    const bottomMargin = 20;

    // Draw vertical grid lines exactly at bit boundaries
    ctx.strokeStyle = "#888";  // Darker grid color for better visibility
    ctx.lineWidth = 1;
    for (let i = 0; i <= binaryDataLength; i++) {
        let x = leftMargin + i * currentUnitWidth;
        ctx.beginPath();
        ctx.moveTo(x, topMargin);
        ctx.lineTo(x, height - bottomMargin);
        ctx.stroke();
    }

    // (Optional) Draw horizontal grid lines matching typical voltage levels
    // For example, if your waveform uses midY-50, midY, and midY+50:
    ctx.beginPath();
    ctx.moveTo(leftMargin, midY - 50);
    ctx.lineTo(width - rightMargin, midY - 50);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(leftMargin, midY);
    ctx.lineTo(width - rightMargin, midY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(leftMargin, midY + 50);
    ctx.lineTo(width - rightMargin, midY + 50);
    ctx.stroke();
    
    // Now draw axes over the grid
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    
    // X-axis (Time)
    ctx.beginPath();
    ctx.moveTo(leftMargin, midY);
    ctx.lineTo(width - rightMargin, midY);
    ctx.stroke();
    
    // Y-axis (Voltage)
    ctx.beginPath();
    ctx.moveTo(leftMargin, topMargin);
    ctx.lineTo(leftMargin, height - bottomMargin);
    ctx.stroke();
    
    // Add labels
    ctx.font = "14px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Time", width - rightMargin - 40, midY + 20);
    
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Voltage", 0, 0);
    ctx.restore();
}



  // Function to Download the grapgh as an image

  function downloadCanvas() {
    setTimeout(() => {  // Delay to ensure drawing completes before downloading
        const link = document.createElement('a');
        link.download = "line_coding_graph.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, 500);  // Delay of 500ms to let final rendering complete
  }

  document.getElementById("downloadGraph").addEventListener("click", downloadCanvas);



    runButton.addEventListener("click", update);
  });
