      // BELOW CODE FOR WEBSOCKET FEATURE
      const chatBox = document.getElementById('chat-box');
      const input = document.getElementById('message-input');
      const sendBtn = document.getElementById('send-btn');

      // Helper to add a message line to the chat box
      function addMessage(text, who) {
        const div = document.createElement('div');
        div.className = `msg ${who}`;
        div.textContent = (who === 'you' ? 'You: ' : 'Server: ') + text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      // Connect to WebSocket server (same host & port as page)
      const socket = new WebSocket(`ws://${window.location.host}`);

      socket.addEventListener('open', () => {
        addMessage('Connected to WebSocket server.', 'server');
      });

      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.from === 'server') {
            addMessage(data.text, 'server');
          } else {
            addMessage(event.data, 'server');
          }
        } catch {
          // if it's not JSON
          addMessage(event.data, 'server');
        }
      });

      socket.addEventListener('close', () => {
        addMessage('Disconnected from server.', 'server');
      });

      socket.addEventListener('error',  (event) => {
        console.error('Websocket error', event);
      });

      // Send message function
      function sendMessage() {
        const text = input.value.trim();
        if (!text || socket.readyState !== WebSocket.OPEN) return;
        // if (socket.readyState !== WebSocket.OPEN) {
        //   addMessage('Cannot send: WebSocket is not connected.', 'server');
        //   console.log('Socket not open, readyState =', socket.readyState);
        //   return;
        // }

        // show it in the UI
        addMessage(text, 'you');

        // send to server
        socket.send(text);

        input.value = '';
        input.focus();
      }

      //Click send button
      sendBtn.addEventListener('click', sendMessage);

      //Press Enter to send
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });


      // Below code for Hash-Based Navigation
      const routes = {
        about: () => `
            <h2>Profile Section</h2>
            <p>In this section, we will give you information about ourselves alongside our technical background.</p>
                <p><b>Full Name:</b>Johnson Dang</p>
                <p><b>About Me:</b> An Information Technology student studying at York University. I am currently in my fourth year. Throughout my time here, I have increased my knowledge around technology and my skills aswell.</p>
                <p><b>Technical Background:</b> Languages that I can undestand to a high degree are: Python, Java, XML. Expertise in web content creation, layout design, and working inside databases.</p>

                <p><b>Full Name:</b> Patrick Brian Colorina</p>
                <p><b>About Me:</b> I am also an Information Technology student at the same school lmao</p>
                <p><b>Technical Background:</b>Fill in</p>

                <p><b>Full Name:</b>Fill in</p>
                <p><b>About Me:</b>Fill in</p>
                <p><b>Technical Background:</b>Fill in</p>
                <b>If you want we could just add stock image online for an person since i dont feel like putting my pic on here</b>
        `,
        education: () => `
            <h2>Education</h2>
            <p>In this section, we will give you a rundown of our education.</p>
                <p><b>Full Name:</b>Johnson Dang</p>
                <p><b>Education:</b> An Information Technology student studying at York University. I am currently in my fourth year. Throughout my time here, I have increased my knowledge around technology and my skills aswell.</p>
        
                <p><b>Full Name:</b> Patrick Brian Colorina</p>
                <p><b>Technical Background:</b>Fill in</p>

                <p><b>Full Name:</b>Arsal</p>
                <p><b>About Me:</b>Fill in</p>       
        `,
        experience: () => `
            <h2>Education</h2>
            <p>Insert education here</p>
        `,
        experience: () => `
            <h2>Experience</h2>
            <p>Insert experience here</p>
        `
      };

      const mainDiv = document.getElementById('main-section'); 

      function setActiveLink(current) {
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        const link = document.getElementById('link-' + current);
        if (link) link.classList.add('active');
      }

      function renderRoute() {
        let hash = window.location.hash.substring(1) || 'about';

        if (!routes[hash]) {
          hash = 'about';
          window.location.hash = '#about';
        }

        mainDiv.innerHTML = routes[hash]();

        setActiveLink(hash);
      }
      
      window.addEventListener('load', renderRoute);
      window.addEventListener('hashchange', renderRoute);