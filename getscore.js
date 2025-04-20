async function loadFeedback() {
    try {
      const res = await fetch('https://aiserver-phi.vercel.app/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'username': localStorage.getItem("username"),
        },
      });
      const data = await res.json();
  
      document.getElementById('overall-score').textContent = `Score: ${data.overall_score}`;
      document.getElementById('overall-feedback').textContent = data.overall_feedback;
      document.getElementById('date').textContent = data.date;
  
      const breakdown = data.breakdown;
      const breakdownDiv = document.getElementById('breakdown');
      for (const [category, details] of Object.entries(breakdown)) {
        const el = document.createElement('div');
        el.className = 'feedback-item';
        el.innerHTML = `<strong>${category} (${details.score})</strong><br>${details.feedback}`;
        breakdownDiv.appendChild(el);
      }
  
      document.getElementById('strengths').textContent = data.strengths;
  
      const improvementList = document.getElementById('improvement-list');
      improvementList.innerHTML = '';
      data.areas_for_improvement.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        improvementList.appendChild(li);
      });
  
    } catch (error) {
      console.error("❌ Error loading feedback:", error);
      document.querySelector('.container').innerHTML = "<p>Failed to load feedback. Please try again.</p>";
    }
  }
  
  async function goHome() {
    await fetch('https://aiserver-phi.vercel.app/home', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': localStorage.getItem("username"),
      },
    });
    localStorage.removeItem("qno");
    window.location.href = "./aifrontend.html";
  }
  
  async function giveAnotherInterview() {
    await fetch('https://aiserver-phi.vercel.app/home', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': localStorage.getItem("username"),
      },
    });
    localStorage.removeItem("qno");
    window.location.href = "./interviewstart.html";
  }
  
  loadFeedback();
  