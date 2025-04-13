// Interactive terminal functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const commandInput = document.querySelector('.command-input');
    const terminalSections = document.querySelectorAll('.terminal-section');
    const folderLinks = document.querySelectorAll('.folder');
    const terminalContent = document.querySelector('.terminal-content');
    const interactive = document.querySelector('.terminal-interactive');
    
    // Set focus to command input
    commandInput.focus();
    
    // Track commands that have been processed to prevent duplicates
    const processedCommands = new Set();
    
    // Focus on command input when clicking anywhere in the terminal
    document.querySelector('.terminal').addEventListener('click', function(e) {
      // Don't steal focus if clicking a link or another interactive element
      if (!e.target.closest('a') && 
          !e.target.closest('.command-link') && 
          e.target !== commandInput) {
        commandInput.focus();
      }
    });
    
    // Folder navigation
    folderLinks.forEach(link => {
      // Remove any existing event listeners
      link.removeEventListener('click', folderClickHandler);
      // Add new event listener
      link.addEventListener('click', folderClickHandler);
    });
    
    function folderClickHandler(e) {
      e.preventDefault();
      e.stopPropagation(); // Stop event from bubbling up
      
      const section = this.getAttribute('data-section');
      const commandId = `cd-${section}-${Date.now()}`;
      
      // Check if this exact command has been processed recently
      if (processedCommands.has(commandId)) {
        return;
      }
      
      // Add to processed commands set
      processedCommands.add(commandId);
      
      // Remove it after a short delay to allow future clicks
      setTimeout(() => {
        processedCommands.delete(commandId);
      }, 500);
      
      // Create a command line showing what was executed
      const commandLineOutput = document.createElement('div');
      commandLineOutput.className = 'terminal-line-executed';
      commandLineOutput.innerHTML = `<span class="prompt">aswin@portfolio:~$</span> <span class="command">cd ${section}</span>`;
      
      // Create container for this command execution
      const commandContainer = document.createElement('div');
      commandContainer.className = 'command-output-container';
      commandContainer.appendChild(commandLineOutput);
      
      // Insert before interactive terminal
      terminalContent.insertBefore(commandContainer, interactive);
      
      // Execute the section display
      showSection(section, commandContainer);
      
      // Refocus on input
      setTimeout(() => {
        commandInput.focus();
        // Scroll to make the new content visible
        commandContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // Command execution
    commandInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const command = this.textContent.trim().toLowerCase();
        if (command) {
          // Create a command line showing what was executed
          const commandLineOutput = document.createElement('div');
          commandLineOutput.className = 'terminal-line-executed';
          commandLineOutput.innerHTML = `<span class="prompt">aswin@portfolio:~$</span> <span class="command">${escapeHtml(command)}</span>`;
          
          // Create container for this command execution
          const commandContainer = document.createElement('div');
          commandContainer.className = 'command-output-container';
          commandContainer.appendChild(commandLineOutput);
          
          // Insert before interactive terminal
          terminalContent.insertBefore(commandContainer, interactive);
          
          // Execute the command
          executeCommand(command, commandContainer);
          
          // Clear input
          this.textContent = '';
          
          // Refocus on input and scroll to new content
          setTimeout(() => {
            commandInput.focus();
            commandContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
      }
    });

    // Ensure cursor blinks and input works by adding this click handler
    commandInput.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent the terminal click handler from refocusing
    });
    
    // Execute terminal command
    function executeCommand(command, container) {
        // Process the command and add its output
        switch(command) {
          case 'help':
            showHelp(container);
            break;
          case 'clear':
            clearTerminal();
            break;
          case 'ls':
          case 'ls -la':
            showFileList(container);
            break;
          case 'about':
          case 'cd about':
            showSection('about', container);
            break;
          case 'experience':
          case 'cd experience':
            showSection('experience', container);
            break;
          case 'projects':
          case 'cd projects':
            showSection('projects', container);
            break;
          case 'education':
          case 'cd education':
            showSection('education', container);
            break;
          case 'skills':
          case 'cd skills':
            showSection('skills', container);
            break;
          case 'home':
          case 'cd ~':
          case 'cd':
            hideAllSections();
            break;
          case 'resume':
          case 'download resume':
            window.open('https://drive.google.com/uc?export=download&id=1CUWTsMKTp2AZn35K_V4wWzwChCv9miYg', '_blank');
            showMessage('Downloading resume...', container);
            break;
          case 'contact':
            showContact(container);
            break;
          case 'github':
            window.open('https://github.com/aswinbennyofficial', '_blank');
            showMessage('Opening GitHub profile...', container);
            break;
          case 'linkedin':
            window.open('https://linkedin.com/in/aswinbenny', '_blank');
            showMessage('Opening LinkedIn profile...', container);
            break;
          case 'blog':
            window.open('https://blog.aswinbenny.in/', '_blank');
            showMessage('Opening blog...', container);
            break;
          case 'discord':
            window.open('https://discordapp.com/users/863725040738369556', '_blank');
            showMessage('Opening Discord profile...', container);
            break;
        
          case 'exit':
          case 'quit':
            showExitMessage(container);
            break;
        case 'fastfetch':
            showSystemInfo(container);
            break;
          default:
            showUnknownCommand(command, container);
        }
    }
    
    // Simple message output
    function showMessage(message, container) {
      const messageOutput = document.createElement('div');
      messageOutput.className = 'terminal-output';
      messageOutput.innerHTML = `<p>${message}</p>`;
      container.appendChild(messageOutput);
    }
    
    // Show FileList with clickable commands
    function showFileList(container) {
      const fileListOutput = document.createElement('div');
      fileListOutput.className = 'terminal-output';
      fileListOutput.innerHTML = `
        <p>No files found...</p>
      `;


      container.appendChild(fileListOutput);
      
      // Add event listeners to the new command links
      const commandLinks = fileListOutput.querySelectorAll('.command-link');
      commandLinks.forEach(link => {
        // Remove existing event listeners first
        link.removeEventListener('click', commandLinkHandler);
        // Add new event listener
        link.addEventListener('click', commandLinkHandler);
      });
      
      // Also attach event listeners to the folder links again
      const newFolderLinks = fileListOutput.querySelectorAll('.folder');
      newFolderLinks.forEach(link => {
        // Remove existing event listeners first
        link.removeEventListener('click', folderClickHandler);
        // Add new event listener
        link.addEventListener('click', folderClickHandler);
      });
    }


    // Show the system information
    function showSystemInfo(container) {
        const systemInfo = `
        <pre>
                                             OS: Fedora Linux 41 (Workstation Edition) x86_64
        .:cccccccccccccccccccccccccc:.       Host: HP Laptop 15-fd0xxx
    .;ccccccccccccc;.:dddl:.;ccccccc;.       Kernel: Linux 6.13.9-200.fc41.x86_64
    .:ccccccccccccc;OWMKOOXMWd;ccccccc:.     Uptime: 1 day, 23 hours, 50 mins
    .:ccccccccccccc;KMMc;cc;xMMc;ccccccc:.   Packages: 2433 (rpm), 34 (flatpak)
    ,cccccccccccccc;MMM.;cc;;WW:;cccccccc,   Shell: zsh 5.9
    :cccccccccccccc;MMM.;cccccccccccccccc:   Display (CMN153B): 1920x1080 @ 60 Hz in 15" [Bu]
    :ccccccc;oxOOOo;MMM000k.;cccccccccccc:   DE: GNOME 47.5
    ccccc;0MMKxdd:;MMMkddc.;cccccccccccc;    WM: Mutter (Wayland)
    ccccc;XMO';cccc;MMM.;cccccccccccccccc'   WM Theme: Adwaita-dark
    ccccc;MMo;ccccc;MMW.;ccccccccccccccc;    Theme: Adwaita-dark [GTK2/3/4]
    ccccc;0MNc.ccc.xMMd;ccccccccccccccc;     Icons: Adwaita [GTK2/3/4]
    cccccc;dNMWXXXWM0:;cccccccccccccc:,      Font: Cantarell (11pt) [GTK2/3/4]
    cccccccc;.:odl:.;cccccccccccccc:,.       Cursor: Adwaita (24px)
    cccccccccccccccccccccccccccc:'.          Terminal: ghostty 1.1.3
    :ccccccccccccccccccccccc:;,..            Terminal Font: JetBrainsMono Nerd Font (13pt)
    ':cccccccccccccccc::;,.                  CPU: 12th Gen Intel(R) Core(TM) i5-1235U (12) @2.7GHz
                                             GPU: Intel Iris Xe Graphics @ 1.20 GHz [Integrated]
                                             Memory: 7.41 GiB / 15.26 GiB (49%)
                                             Swap: 1.80 GiB / 8.00 GiB (23%)
                                             Disk (/): 195.09 GiB / 401.74 GiB (49%) - btrfs
                                             Local IP (wlo1): 192.168.162.2/24
                                             Battery (Primary): 100% [AC Connected]
                                             Locale: en_US.UTF-8
        </pre>
        `;
        const systemInfoOutput = document.createElement('div');
        systemInfoOutput.className = 'terminal-output';
        systemInfoOutput.innerHTML = systemInfo;
        container.appendChild(systemInfoOutput);
    }

    
    // Function to handle command link clicks
    function commandLinkHandler(e) {
      e.preventDefault();
      e.stopPropagation(); // Stop event from bubbling up
      
      const command = this.getAttribute('data-command');
      const commandId = `${command}-${Date.now()}`;
      
      // Check if this exact command has been processed recently
      if (processedCommands.has(commandId)) {
        return;
      }
      
      // Add to processed commands set
      processedCommands.add(commandId);
      
      // Remove it after a short delay to allow future clicks
      setTimeout(() => {
        processedCommands.delete(commandId);
      }, 500);
      
      // Create a command line showing what was executed
      const commandLineOutput = document.createElement('div');
      commandLineOutput.className = 'terminal-line-executed';
      commandLineOutput.innerHTML = `<span class="prompt">aswin@portfolio:~$</span> <span class="command">${command}</span>`;
      
      // Create container for this command execution
      const newContainer = document.createElement('div');
      newContainer.className = 'command-output-container';
      newContainer.appendChild(commandLineOutput);
      
      // Insert before interactive terminal
      terminalContent.insertBefore(newContainer, interactive);
      
      // Execute the command
      executeCommand(command, newContainer);
      
      // Refocus on input and scroll to new content
      setTimeout(() => {
        commandInput.focus();
        newContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // Help command
    function showHelp(container) {
      const helpOutput = document.createElement('div');
      helpOutput.className = 'terminal-output';
      helpOutput.innerHTML = `
        <div class="command-list">
          <p>Available commands:</p>
          <div class="command-grid">
            <a href="#" class="command-link" data-command="help">help</a>
            <a href="#" class="command-link" data-command="about">about</a>
            <a href="#" class="command-link" data-command="experience">experience</a>
            <a href="#" class="command-link" data-command="projects">projects</a>
            <a href="#" class="command-link" data-command="education">education</a>
            <a href="#" class="command-link" data-command="skills">skills</a>
            <a href="#" class="command-link" data-command="contact">contact</a>
            <a href="https://drive.google.com/uc?export=download&id=1CUWTsMKTp2AZn35K_V4wWzwChCv9miYg" class="command-link" data-command="resume">resume</a>
            <a href="https://github.com/aswinbennyofficial/" class="command-link" data-command="github">github</a>
            <a href="https://www.linkedin.com/in/aswinbenny/" class="command-link" data-command="linkedin">linkedin</a>
            <a href="https://blog.aswinbenny.in/" class="command-link" data-command="blog">blog</a>
            <a href="https://discord.com/users/863725040738369556" class="command-link" data-command="discord">discord</a>
            <a href="#" class="command-link" data-command="fastfetch">fastfetch</a>
            <a href="#" class="command-link" data-command="clear">clear</a>
          </div>
        </div>
      `;
      
      
      container.appendChild(helpOutput);
      
      // Add event listeners to command links
      const commandLinks = helpOutput.querySelectorAll('.command-link');
      commandLinks.forEach(link => {
        // Remove existing event listeners first
        link.removeEventListener('click', commandLinkHandler);
        // Add new event listener
        link.addEventListener('click', commandLinkHandler);
      });
    }
    
    // Contact command
    function showContact(container) {
      const contactOutput = document.createElement('div');
      contactOutput.className = 'terminal-output';
      contactOutput.innerHTML = `
        <div class="contact-content">
          <p><span class="label">Email:</span> <a href="mailto:portfolio@aswinbenny.anonaddy.com">portfolio@aswinbenny.anonaddy.com</a></p>
          <p><span class="label">GitHub:</span> <a href="https://github.com/aswinbennyofficial" target="_blank">github.com/aswinbennyofficial</a></p>
          <p><span class="label">LinkedIn:</span> <a href="https://linkedin.com/in/aswinbenny" target="_blank">linkedin.com/in/aswinbenny</a></p>
          <p><span class="label">Discord:</span> <a href="https://discordapp.com/users/863725040738369556" target="_blank">aswinbenny</a></p>
          <p><span class="label">Blog:</span> <a href="https://blog.aswinbenny.in/" target="_blank">blog.aswinbenny.in</a></p>
        </div>
      `;
      
      container.appendChild(contactOutput);
    }
    
    // Unknown command
    function showUnknownCommand(command, container) {
      const errorOutput = document.createElement('div');
      errorOutput.className = 'terminal-output';
      errorOutput.innerHTML = `
        <p style="color: #ff5f56;">Command not found: ${escapeHtml(command)}. Type 'help' for available commands.</p>
      `;
      
      container.appendChild(errorOutput);
    }
    
    // Exit message
    function showExitMessage(container) {
      const exitOutput = document.createElement('div');
      exitOutput.className = 'terminal-output';
      exitOutput.innerHTML = `
        <p>Thanks for visiting! Have a great day!</p>
      `;
      
      container.appendChild(exitOutput);
    }
    
    // Clear terminal
    function clearTerminal() {
      // Remove all command output containers
      const commandContainers = document.querySelectorAll('.command-output-container');
      commandContainers.forEach(container => {
        container.remove();
      });
      
      // Hide all sections
      hideAllSections();
      
      // Make sure input is focused
      setTimeout(() => {
        commandInput.focus();
      }, 100);
    }
    
    // Show section
    function showSection(sectionId, container) {
      // Get the content from the existing section
      const section = document.getElementById(sectionId);
      if (section) {
        // Clone the section content
        const sectionContent = section.querySelector('.terminal-output').cloneNode(true);
        
        // Add content to the container
        container.appendChild(sectionContent);
      }
    }
    
    // Hide all sections
    function hideAllSections() {
      terminalSections.forEach(section => {
        section.classList.remove('active');
      });
    }
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    // Remove the global click handler that was causing duplicates
    const existingHandler = document.querySelector('.terminal')._clickHandler;
    if (existingHandler) {
      document.removeEventListener('click', existingHandler);
    }
    
    // Create a single, controlled click handler for command links
    function globalCommandLinkHandler(e) {
      if (e.target.classList.contains('command-link') || e.target.closest('.command-link')) {
        // We already handle this with individual event listeners
        // Don't do anything here to prevent duplicates
        return;
      }
    }
    
    // Store the handler reference so we can remove it later if needed
    document.querySelector('.terminal')._clickHandler = globalCommandLinkHandler;
    document.addEventListener('click', globalCommandLinkHandler);
    
    // Show file list initially (same as running ls command)
    // Create initial container for the ls command
    const initialContainer = document.createElement('div');
    initialContainer.className = 'command-output-container';
    
    const initialCommandLine = document.createElement('div');
    initialCommandLine.className = 'terminal-line-executed';
    initialCommandLine.innerHTML = `<span class="prompt">aswin@portfolio:~$</span> <span class="command">help</span>`;
    
    initialContainer.appendChild(initialCommandLine);
    terminalContent.insertBefore(initialContainer, interactive);
    
    // Show the file list in this container
    showHelp(initialContainer);
  });



 