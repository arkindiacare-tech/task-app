

const WORKER_URL = 'https://task-nilesh.arkindiacare.workers.dev/'; // replace with your Worker URL

async function handleLogin(){
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const response = await fetch(`${WORKER_URL}/?action=getTasks&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  const data = await response.json();

  if(data.success){
    const list = document.getElementById('taskList');
    list.innerHTML='';
    data.tasks.forEach(t=>{
      const li = document.createElement('li');
      li.textContent=`[${t.Status}] ${t.Title} - Assigned to: ${t.Assigned_To}`;
      list.appendChild(li);
    });
  }else{
    alert(data.error);
  }
}
