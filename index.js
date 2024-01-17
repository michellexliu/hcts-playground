console.log('hi');

const openAiUrl = 'https://api.openai.com/v1/chat/completions'; // Replace with the actual API endpoint
let apiKey = localStorage.getItem('key') ?? ''; // Replace with your actual OpenAI API key
let systemPrompt =
  localStorage.getItem('systemPrompt') ?? 'Say this is a test!';

if (systemPrompt != null && systemPrompt !== '') {
  document.getElementById('systemPrompt').value = systemPrompt;
}
if (apiKey != null && apiKey !== '') {
  document.getElementById('apiKey').value = apiKey;
}
// const obj = {age_range: '3-4 years old',characters:[{name: 'Lily',role: 'main',type: 'human',more_info:'Lily is a curious and adventurous little girl. She loves exploring nature and learning new things.',},],setting: 'a magical forest',interests: 'I love animals and going on adventures'};

function addCharacter() {
  let div = document.createElement('div');
  div.classList.add('character');
  div.innerHTML = `
    <input type="text" class="name" placeholder="Name">
    <select class="role">
        <option value="main">Main</option>
        <option value="secondary">Secondary</option>
        <option value="antagonist">Antagonist</option>
    </select>
    <input type="text" class="type" placeholder="Type">
    <input type="text" class="moreInfo" placeholder="More Info">
    <button type="button" onclick="this.parentElement.remove()">Remove</button>
`;
  document.getElementById('characters').appendChild(div);
}

document
  .getElementById('settingsForm')
  .addEventListener('submit', function (event) {
    event.preventDefault(); // Prevents form from submitting in the traditional way

    apiKey = document.getElementById('apiKey').value;
    localStorage.setItem('key', apiKey);

    setSystemPrompt(document.getElementById('systemPrompt').value);

    populateStoryInfo();

    makeRequest();

    document.getElementById('customOption').style.display = 'flex';
  });

let messages = [{ role: 'system', content: systemPrompt }];

const setSystemPrompt = (prompt) => {
  localStorage.setItem('systemPrompt', prompt);
  messages = [{ role: 'system', content: prompt }];
};

const addUserMessage = (message) => {
  messages.push({ role: 'user', content: message });
};

const addAssistantMessage = (message) => {
  messages.push({ role: 'assistant', content: message });
};

function showLoadingOverlay() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

const displayStories = (stories) => {
  console.log(stories);
  if (stories == null) return;
  const storyDisplay = stories.map((story) => `<p>${story}</p>`);

  document.getElementById('story').innerHTML = storyDisplay.join('<br />');
};

function createRadioOptions(options) {
  let container = document.getElementById('radioContainer');
  container.innerHTML = '';

  options.forEach(function (option, index) {
    // Create radio input
    let radioInput = document.createElement('input');
    radioInput.type = 'radio';
    radioInput.id = 'option' + index;
    radioInput.name = 'options';
    radioInput.value = option;

    // Create label
    let label = document.createElement('label');
    label.htmlFor = 'option' + index;
    label.textContent = option;

    // Append to container
    container.appendChild(radioInput);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  });
}

const populateStoryInfo = () => {
  let formData = {
    age_range: document.getElementById('ageRange').value,
    characters: [],
    setting: document.getElementById('setting').value,
    interests: document.getElementById('interests').value,
  };

  document.querySelectorAll('.character').forEach(function (characterDiv) {
    formData.characters.push({
      type: 'initial',
      name: characterDiv.querySelector('.name').value,
      role: characterDiv.querySelector('.role').value,
      type: characterDiv.querySelector('.type').value,
      more_info: characterDiv.querySelector('.moreInfo').value,
    });
  });

  console.log(JSON.stringify(formData));

  addUserMessage(JSON.stringify(formData));
};

function addCustomOption() {
  let customOptionValue = document
    .getElementById('customOptionInput')
    .value.trim();
  if (customOptionValue) {
    selectOption(null, customOptionValue);
    document.getElementById('customOptionInput').value = ''; // Clear the input field
  }
}

function createDivButtons(options) {
  let container = document.getElementById('buttonContainer');
  container.innerHTML = '';

  options.forEach(function (option) {
    // Create div element
    let div = document.createElement('div');
    div.classList.add('button');
    div.textContent = option;
    div.onclick = function () {
      selectOption(div, option);
    };

    // Append to container
    container.appendChild(div);
  });
}

function selectOption(selectedDiv, value) {
  console.log('path updated to:', value); // For demonstration

  // Update styles for selected div
  if (selectedDiv) selectedDiv.classList.add('selected');

  // Disable all buttons
  let buttons = document.querySelectorAll('#buttonContainer .button');
  buttons.forEach(function (button) {
    button.onclick = null;
    button.classList.add('disabled');
  });

  addUserMessage(`{"type": "continue", "path": "${value}}"`);
  makeRequest();
}

const makeRequest = () => {
  const data = {
    messages,
    model: 'gpt-3.5-turbo',
    temperature: 0,
  };

  console.log('input', data);

  showLoadingOverlay();
  // Making the POST request
  fetch(openAiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      const raw = data.choices[0]?.message.content;
      addAssistantMessage(raw);

      console.log('raw', JSON.parse(raw));
      const parsed = JSON.parse(raw);
      const paths = parsed?.paths;
      const text = parsed?.text;

      displayStories(text);
      createDivButtons(paths);
      console.log('Success:', data);
      hideLoadingOverlay();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
};

/**
 *
You are a helpful assistant that writes childrens books.
You will be given prompts in the following JSON format, demarcated with `:
These are the keys:
type: either 'initial' or 'continue'.
age_range: the age of the child. you should alter the reading level and complexity of the story according to this. options are '3-4 years old', '5-6 years old', and '6-8 years old'. these should be independently readable for a child in that age group
characters: an array of the characters in the story. each character has a name, role (options are main, secondary, or antagonist), and more_info
setting: the setting of the story
interests: the child's interests or things they like. incorporate these interests into the plot and story.
path: if type is indicated as 'continue,' continue developing the story's plot according to what's described in this field.

Example 1:
`{'type': 'initial', 'age_range': '3-4 years old', 'characters': [{'name': 'raymond', 'role': 'main', 'type': 'puppy', 'more_info': 'he is slightly mischievous but kind-hearted. he enjoys playing fetch. also he can talk.'}], 'setting': 'space', 'interests': 'i really like dogs and astronauts'}`

Example 2:
`{'type': 'continue', 'path': 'raymond helps the alien fix his ship'}`

With this information, you should return the result in JSON format.

These are the keys:
text: the generated story, with each page of the book represented as an array. If there are line breaks, use a \n delimeter. make sure only the story is included here, do not include page number or any other information here.
characters: an array of the characters. if new characters have been generated in the story, add them here.
paths: an array of 4 options that a child can choose to advance the story, based on the most recent set of stories. sort of like options in a choose your own adventure story. these should be actionable items that the character(s) may do. paths generated in previous stories should not be repeated.

Here is an example:
{text: ["one upon a time, in a faraway land, there lived a little puppy named raymond.\n\nRaymond was known for being mischievous, but he had a heart of gold.\n\nOne sunny morning, Raymond met a new friend named Timmy", "Raymond and Timmy found a shiny bone in their backyard.\n\nThey saw a friendly astronaut come to them."], characters: ["characters": [{"name": "raymond","role": "main","type": "puppy","more_info": "he is slightly mischievous but kind-hearted. he enjoys playing fetch. also he can talk."},{"name": "timmy","role": "secondary","type": "human"},
{"name": "ally","role": "secondary","type": "astronaut"}], paths: ["raymond helps fix the ship", "raymond goes home", "raymond befriends the alien"]}

All prompts should have no spaces or extra characters in them, and they should be parsed as JSON. the text array should have 8-10 items.

If the type is set to 'continue', do not repeat any of the previous content in the output produced.
 */
