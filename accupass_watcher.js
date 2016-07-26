
const spawn = require('child_process').spawn;
const request = require('request')

const config = require('./config.json');
const event_id = config.accupass.event_id;
const ticket_name_search = config.accupass.ticket_name_search;
const script = config.accupass.ring_script;
const interval = config.accupass.interval || 30 * 60;
const mailgun = require('mailgun-js')(config.mailgun)

function ring(){
  spawn(script);
}

function go(){
  try {
    request(`https://api.accupass.com/v3/event/${event_id}/getEventTickets`, (err, response, body) => {
      var bang = [];
      JSON.parse(body).eventTicketGroups[0].eventTickets.map((ticket) => {
        if (ticket.name.search(ticket_name_search) != -1){
          if (ticket.ticketStatusStr.search('已') == -1) {
            var bang_msg = `!!! ${(new Date()).toString()} >> ${ticket.name}'s status is ${ticket.ticketStatusStr}!`;
            console.log(bang_msg);
            bang.push(bang_msg);
          }
          else
            console.log(`${(new Date()).toString()}: ${ticket.name}'s status is ${ticket.ticketStatusStr}...`);
        }
      });
      if(bang.length){
        config.mail.to.forEach((to) => {
          var mail = {from: config.mail.from, to: to};
          mail.subject = `There are ${bang.length} tickets you need!`;
          
          mail.html = `${bang.join('<br>')}<br><a href=${config.accupass.url}>${config.accupass.url}</a>`;
          console.log(">>> Sending...", mail);
          mailgun.messages().send(mail, (error, body) => {
            if(error) console.error(error);
            console.log(body);
          });
        });
        ring();
      }
    });
  } catch (e) {
    console.error(e);
  }
}

console.log(`Starting checking with event_id:${event_id} and searching for ${ticket_name_search} every ${interval} seconds...`);
go();
setInterval(go, interval * 1000);

