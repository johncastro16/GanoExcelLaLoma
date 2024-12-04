import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';

class MessageHandler {

  constructor() {
    this.appointmentState = {};
    this.hiringState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if (incomingMessage === 'media') {
        await this.sendMedia(message.from);
      } else if (this.appointmentState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage);
      } else if (this.hiringState[message.from]) {
        await this.handleHiringFlow(message.from, incomingMessage);
      } else if (this.assistandState[message.from]) {
        await this.handleAssistandFlow(message.from, incomingMessage);
      } else {
        await this.handleMenuOption(message.from, incomingMessage);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === 'interactive') {
      const option = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);
    }
  }

  isGreeting(message) {
    const greetings = ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "saludos", "como estás", "hl", "menu", "menú"];
    return greetings.includes(message);
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id || "GanoLover";
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `¡Hola ${name}!, Bienvenido 🤗 a GanoExcel La Loma, La tienda virtual de productos saludables 💪 de GanoExcel.\n¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una Opción"
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Comprar' }
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Habla con mIA' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Trabaja con nosotros' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuOpcionalHiring(to) {
    const menuMessage = "*¿Está correcta la información?*"
    const buttons = [
      {
        type: 'reply', reply: { id: 'opt1', title: 'Si, continuar' }
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'No, corregir' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuOpcional(to) {
    const menuMessage = "Quieres continuar con tu compra?"
    const buttons = [
      {
        type: 'reply', reply: { id: 'op_1', title: 'Si' }
      },
      {
        type: 'reply', reply: { id: 'op_2', title: 'No' }
      },
      {
        type: 'reply', reply: { id: 'op_3', title: 'Hablar con un asesor' }
      }
    ];

    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async menuUrl(to) {
    const bodyText = "Nos alegra que te interese comprar nuestros productos saludables 😊\n\nElige el producto de tu interés en nuestro catálogo: "
    const action =
    {
      name: "cta_url",
      parameters: {
        display_text: "Ver catálogo",
        url: "https://wa.me/c/573157465456"
      }
    };
    await whatsappService.sendUrl(to, bodyText, action);
  }

  waiting = (delay, callback) => {
    setTimeout(callback, delay);
  };

  async handleMenuOption(to, option) {
    let response;
    switch (option) {
      case 'option_1':
        this.appointmentState[to] = { step: 'pedido' }
        this.menuUrl(to)
        response = "Ahora, dime qué producto quieres comprar?";
        break;

      case 'op_1':
        response = `*Proceso de pago*
        
        - Consigna el valor del producto en alguno de los medios de pago:


        Medios de pago: 🏦💳

- Bancolombia Ahorros: 52300000966

- ⁠Nequi, Daviplata, Transfiya, Rappipay = 3157465456

- ⁠Ahorro a la Mano:  03157465456

- ⁠Grupo Aval (Banco Occidente, Bogotá, AVvillas) = 816-81550-0


        - *Envianos el comprobante de pago*.
        `;
        this.appointmentState[to] = { step: 'confirma' }
        break
      case 'option_2':
        this.assistandState[to] = { step: 'question' };
        response = 'Realiza tu pregunta: ';
        break;
      case 'option_3':
        this.hiringState[to] = { step: 'contrato' };
        response = "!Nos emociona que quieras hacer parte de nuestra familia! 🥳\n\nPara continuar, dime tu *nombre completo:* ";
        break;
      case 'option_4':
        response = "Te esperamos en nuestro Local!"
        await this.sendLocation(to);
        break;
      case 'option_6':
        response = "Para hablar con un asesor escribe al siguiente contacto"
        await this.sendContact(to);
        break;
      case 'opt1':
        response = '¡Recibido!\nPronto nos pondremos en contacto contigo! 🤗';
        break;
      case 'op_3':
        response = 'Entiendo\nEspera un momento 🤗 te comunicaré con un asesor...';
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú o escribe *menú*.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async sendMedia(to) {
    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';
    // const caption = 'Bienvenida';
    // const type = 'audio';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
    // const caption = '¡Esto es una Imagen!';
    // const type = 'image';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
    // const caption = '¡Esto es una video!';
    // const type = 'video';

    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
    const caption = '¡Esto es un PDF!';
    const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  completeHiring(to) {
    const appointment = this.hiringState[to];
    delete this.hiringState[to];

    const userData = [
      to,
      appointment.nombreCompleto,
      appointment.correo,
      appointment.celular,
      appointment.direccion,
      new Date().toISOString()
    ]

    appendToSheet(userData);

    return `*Verifica tus datos*. 
    
    *Nombre completo:* ${appointment.nombreCompleto}
    *Correo:* ${appointment.correo}
    *Celular:* ${appointment.celular}
    *Dirección:* ${appointment.direccion}
    
    
    *Confirma la información para continuar.*
    `
  }

  completeAppointment(to) {
    const appointment = this.appointmentState[to];
    delete this.appointmentState[to];

    const userData = [
      to,
      appointment.producto,
      appointment.nombre,
      appointment.cantidad,
      appointment.direccion,
      new Date().toISOString()
    ]

    appendToSheet(userData);

    return `*Carrito de compras*. 
    Resumen de tu compra:
    
    *Nombre completo:* ${appointment.nombre}
    *Producto:* ${appointment.producto}
    *Cantidad:* ${appointment.cantidad}
    *Direccion:* ${appointment.direccion}
    
    
    *Verifica que la información esté correcta*
    `
  }

  async handleHiringFlow(to, message) {
    const state = this.hiringState[to];
    let response;

    switch (state.step) {
      case 'contrato':
        state.nombreCompleto = message;
        state.step = 'nombre';
        response = "*Correo electrónico:* ";
        break;
      case 'nombre':
        state.correo = message;
        state.step = 'correo';
        response = "*Celular de contacto:* ";
        break;
      case 'correo':
        state.celular = message;
        state.step = 'celular';
        response = '*Dirección de domicilio completa:* ';
        break;
      case 'celular':
        state.direccion = message;
        response = this.completeHiring(to);
        this.menuOpcionalHiring(to);
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAppointmentFlow(to, message) {
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'pedido':
        state.producto = message;
        state.step = 'datos';
        response = "Para continuar con la compra danos los siguientes datos por favor:\n\nNombre completo:";
        break;
      case 'datos':
        state.nombre = message;
        state.step = 'nombre';
        response = `Cuántos ${state.producto} quieres?`;
        break;
      case 'nombre':
        state.cantidad = message;
        state.step = 'direccion';
        response = 'Ingresa tu dirección completa: ';
        break;
      case 'direccion':
        state.direccion = message;
        state.step = 'confirma';
        response = this.completeAppointment(to);
        this.menuOpcional(to)
        break;
      case 'confirma':
        response = '¡Recibido!\nMuchas gracias por tu compra 🤗';
        break;
      default:
        response = "Lo siento 😔 no entendí tu respuesta\nPor Favor, elige una de las opciones del menú.";
    }
    await whatsappService.sendMessage(to, response);
  }

  async handleAssistandFlow(to, message) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = "¿Resolví tu pregunta?"
    const buttons = [
      { type: 'reply', reply: { id: 'option_4', title: "Si, Gracias" } },
      { type: 'reply', reply: { id: 'option_2', title: 'Hacer otra pregunta' } },
      { type: 'reply', reply: { id: 'option_6', title: 'Asesor' } }
    ];

    if (state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistandState[to];
    await whatsappService.sendMessage(to, response);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendContact(to) {
    const contact = {
      addresses: [
        {
          street: "Carrera 7 #9-60",
          city: "La Loma",
          state: "Cesar",
          zip: "201038",
          country: "Colombia",
          country_code: "CO",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "johcastro1610@hotmail.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "GanoExcel La Loma",
        first_name: "GanoExcel",
        last_name: "La Loma",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "GanoExcel",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+573157465456",
          wa_id: "573157465456",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://johntech-loma.github.io/",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact);
  }

  async sendLocation(to) {
    const latitude = 9.6213894;
    const longitude = -73.5877435;
    const name = 'GanoExcel La Loma';
    const address = 'Cra. 7 #9 - 60, La Loma, Cesar, Colombia.'

    await whatsappService.sendLocationMessage(to, latitude, longitude, name, address);
  }

}

export default new MessageHandler();