function extractVideoId(link){
  const m = link.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

function applyLink(){
  const link = document.getElementById("tiktokLink").value;
  const id = extractVideoId(link);

  if(!id){
    alert("Постави ПЪЛЕН TikTok линк с /video/ID");
    return;
  }

  document.getElementById("videoId").textContent = "VIDEO_ID: " + id;
  document.getElementById("player").src =
    "https://www.tiktok.com/player/v1/" + id;

  localStorage.setItem("videoId", id);
}

function sendGreeting(e){
  e.preventDefault();
  const name = document.getElementById("name").value || "Анонимен";
  const text = document.getElementById("text").value;

  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<strong>${name}:</strong> ${text}`;
  document.getElementById("messages").prepend(div);

  document.getElementById("text").value = "";
}

// restore last video
const saved = localStorage.getItem("videoId");
if(saved){
  document.getElementById("player").src =
    "https://www.tiktok.com/player/v1/" + saved;
  document.getElementById("videoId").textContent = "VIDEO_ID: " + saved;
}
