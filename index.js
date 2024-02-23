c_(document).ready(function($) {
	let currentPageNumber = 1;
	let globalScrollValue = 10;
	let chatPerPage = 10;
	let ajax_request = null;
	let update_chat_ajax_request = null;
	let update_ajax_request_counter = 0;
	let ajax_request_counter = 0;
	let ajax_request_success_counter = 0;
	let update_chat_ajax_request_success_counter = 0;
	let formSendMessage = document.querySelector('.form-send-message') ,	messageInput = document.querySelector('.message-input');
	let chatHistoryBody = document.querySelector('.chat-history-body');
	let chatStack = [];
	function scrollToBottom()
	{
		let innerHe = 0;
		$('.chat-history-body').find('li').each(function(e) {
			innerHe += $(this).height()
		})
		console.log("Height:"+innerHe)
		chatHistoryBody.scrollTo(0, innerHe+10 );
	}
	if (chatHistoryBody) {
		new PerfectScrollbar(chatHistoryBody, {
			wheelPropagation: false,
			suppressScrollX: true,
			wheelSpeed :1
		});
	}
	formSendMessage.addEventListener('submit', e => {
		e.preventDefault();
		if (messageInput.value) {
			var chat_id = $('#chat-list').find('li.active').attr('data-id');
			var data = {
				action: 'arsin_chat_online_send_message',
				message: messageInput.value,
				file: 0,
				chat_id: chat_id
			};
			let message_value = messageInput.value;
			$.ajax({
				type: 'post',
				url : chat_online_ajax_url,
				data: data,
				dataType: 'json',
				success :	function(r) {
					if (r.data.status === true) {
						let chatItem= [];
						chatItem[r.data.id] = {
							id: `${r.data.id}`,
							chat_id :chat_id,
							message : message_value,
							create_date : r.data.time,
							file_id : '',
							file_type : '',
							file_url : '',
							has_file : 0,
							create_date_g : r.data.create_date_g,
							status : r.data.message_status,
							update_date : r.data.time,
							user_id : arsin_current_user_id,
							display : true
						};
						chatStack.push(chatItem);

						var chat_box = '<li data-id="'+r.data.id+'" class="chat-message chat-message-right"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text"><p class="mb-0">' + message_value + '</p></div><div class="text-end text-muted mt-1"><i class="bx bx-check-double text-success"></i><small class="js-create-date-time">'+r.data.time+'</small></div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
						if ($('.e-chat-list-wrap').find('li').length > 0) {
							$('.e-chat-list-wrap').find('li:last-child').after(chat_box);
						} else {
							$('.e-chat-list-wrap').append(chat_box);
						}
					}

				},
				error:	function() {}}).done(function(r) {

			});
			messageInput.value = '';
			scrollToBottom();
		}

	});
	function resolveChatData(type)
	{
		var section = c_('.app-chat');
		var chat_id = $('#chat-list').find('li.active').attr('data-id');
		if (type === 'update-stack') {
			let mID =  getLastStackId();
			if (mID === false || typeof mID === NaN ) {
				console.log("type : " , typeof mID)
				return false;
			}
			let hiddenMesseges = searchInMessagesByDisplay();
			let check_status_ids = '';
			if (hiddenMesseges !== false && hiddenMesseges.length > 0) {
				check_status_ids = hiddenMesseges;
			}
			var data = {
				action: 'arsin_chat_online_get_chat_by_limit',
				chat_id: chat_id,
				message_id: mID,
				type: 'update',
				hidden_messages : check_status_ids
			};
		} else if (type === 'fetch-stack') {
			let mID =  getFirstStackId();
			console.log("loading bbefore " + mID)
			if (mID === false || typeof mID === NaN ) {
				return false;
			}
			var data = {
				action: 'arsin_chat_online_get_chat_by_limit',
				chat_id: chat_id,
				message_id: mID,
				type: 'fetch'
			};
		} else {
			var data = {
				action: 'arsin_chat_online_get_chat',
				chat_id: chat_id,
				page: 40
			};
		}

		return new Promise((resolve , reject) => {
			$.ajax({
				type: 'post',
				url : chat_online_ajax_url,
				data: data,
				dataType: 'json',
				success : function(r) {
					if (typeof r == 'object') {
						console.log(r)
						resolve(r);
					} else {
						console.log(r)
						reject(false);
					}
				},
				beforeSend: function(r) {

				}
			}).done(() => {c_('.app-chat-history').unblock();});
		}).catch((err) => { c_('.app-chat-history').unblock() ; console.log(err); return false });
	}
	async function updateStack(scrollType)
	{
		const x = await resolveChatData('update-stack');
		if (x === false) {
			return;
		}
		let hidden_ids = [];
		let updateGroupTime;
		let groupsUpdate;
		if (x.data !== undefined) {
			if (x.data.display_hidden !== undefined) {
				hidden_ids = x.data.display_hidden;
			}
			if (x.data.update_group_time !== undefined) {
				updateGroupTime = x.data.update_group_time;
			}
			if (x.data.updates !== undefined) {
				groupsUpdate = x.data.updates;
			}
		}
		if (x.display_hidden !== undefined) {
			hidden_ids = x.display_hidden;
		}
		if (x.update_group_time !== undefined) {
			updateGroupTime = x.update_group_time;
		}
		if (x.updates !== undefined) {
			groupsUpdate = x.updates;
		}

		if (typeof updateGroupTime === 'object') {
			let udto = new Object(updateGroupTime);
			if (udto.hasOwnProperty('chat_id')) {
				let upChatId = udto?.chat_id || null;
				let upTime = udto?.time;
				if (upChatId !== null && upChatId !== undefined) {
					$('#chat-list').find('li[data-id="'+upChatId+'"]').find('.last-m-time').html(upTime);
				}
			}
		}
		console.log("other updates:" , groupsUpdate)
		if (Array.isArray(groupsUpdate)) {
			if (groupsUpdate.length) {
				groupsUpdate.forEach(og => {
					console.log( "OG is: " ,og)
					let ogup = new Object(og);
					if (ogup.hasOwnProperty('chat_id')) {
						let upChatId = ogup?.chat_id || null;
						let upTime = ogup?.time;
						if (upChatId !== null && upChatId !== undefined) {
							$('#chat-list').find('li[data-id="'+upChatId+'"]').find('.last-m-time').html(upTime);
						}
					}
				})
			}
		}

		if (hidden_ids.length > 0) {

			for (let i = 0 ; i < hidden_ids.length ; i++) {
				let id =  hidden_ids[i];
				let stackSearchResult = stackSearchById(chatStack , id);

				if (stackSearchResult !== false) {
					let updateStatus =  updateStackMessageDisplayById(id , true);

					if (updateStatus !== false) {
						if ($('.e-chat-list-wrap').find('li[data-id="'+id+'"]').hasClass('d-none')) {
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').removeClass('d-none');
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').css('background' , '#e4ffd7');
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').css('padding' , '20px 10px');
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').css('border-bottom-style' , 'solid');
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').css('border-bottom-color' , '#59c525');
							$('.e-chat-list-wrap').find('li[data-id="'+id+'"]').css('border-bottom-width' , '3px');
						}
					}
				}
			}
		}
		if (x.chat === undefined) {
			return false;
		}
		let stack = [];
		x.chat.forEach(c => {
			stack[c.id] = {
				id: c.id,
				chat_id : c.chat_id,
				message : c.message,
				create_date : c.create_date,
				file_id : c.file_id,
				file_type : c.file_type,
				file_url : c.file_url,
				has_file : c.has_file,
				create_date_g : c.create_date_g,
				status : c.status,
				update_date : c.update_date,
				user_id : c.user_id,
				sender_name : c.sender_name,
				display : c.status == 2
			};
		});
		if (x !== false && x.chat !== undefined) {
			renderChatStack(x , stack , 'down' , 'update');
		}
	}
	async function fetchStack()
	{
		const x = await resolveChatData('fetch-stack');
		if (x.chat === undefined) {
			return false;
		}
		let stack = [];
		x.chat.forEach(c => {
			stack[c.id] = {
				id: c.id,
				chat_id : c.chat_id,
				message : c.message,
				create_date : c.create_date,
				create_date_g : c.create_date_g,
				file_id : c.file_id,
				file_type : c.file_type,
				file_url : c.file_url,
				has_file : c.has_file,
				status : c.status,
				update_date : c.update_date,
				user_id : c.user_id,
				sender_name : c.sender_name,
				display : c.status == 2
			};
		});
		if (x !== false && x.chat !== undefined) {
			stack.reverse();
			renderChatStack(x , stack , 'up' , 'fetch');
		}
		console.log("Stack Length" + chatStack.length)
	}
	async function chatUpdate(scrollType , scroll)
	{
		const x = await resolveChatData('load');
		if (x.chat === undefined) {
			return false;
		}
		let stack = [];
		x.chat.forEach(c => {
			stack[c.id] = {
				id: c.id,
				chat_id : c.chat_id,
				message : c.message,
				create_date : c.create_date,
				create_date_g : c.create_date_g,
				file_id : c.file_id,
				file_type : c.file_type,
				file_url : c.file_url,
				has_file : c.has_file,
				status : c.status,
				update_date : c.update_date,
				user_id : c.user_id,
				sender_name : c.sender_name,
				display : c.status == 2
			};
		});
		if (x !== false && x.chat !== undefined) {
			renderChatStack(x , stack , scrollType , 'load');
			if (scroll == 'scrollToBottom') {
				scrollToBottom();
			}
		}
	}
	let loadChatTimer  = setInterval(function() {
		updateStack('down');
		try {
			updateStackMessageTimes();
		} catch (e) {
			console.log("time update fail" , e)
		};
	}, 7000);
	//Helper Function For Manage Stack
	function convertDateStringToReadableTime(dateString)
	{
		let inputDate = new Date (dateString);
		let currentDate = new Date (Date.now ());
		let diffInSeconds = Math.abs (currentDate.getTime () - inputDate.getTime ()) / 1000;
		let result = "";
		if (diffInSeconds < 60) {
			result = "چند ثانیه پیش";
		} else if (diffInSeconds < 3600) {
			let minutes = Math.floor (diffInSeconds / 60);
			result = minutes + " دقیقه پیش";
		} else if (diffInSeconds < 86400) {
			let hours = Math.floor (diffInSeconds / 3600);
			result = hours + " ساعت پیش";
		} else if (diffInSeconds < 604800) {
			let days = Math.floor (diffInSeconds / 86400);
			result = days + " روز پیش";
		} else if (diffInSeconds < 2592000) {
			let weeks = Math.floor (diffInSeconds / 604800);
			result = weeks + " هفته پیش";
		} else if (diffInSeconds < 31536000) {
			let months = Math.floor (diffInSeconds / 2592000);
			result = months + " ماه پیش";
		} else {
			let years = Math.floor (diffInSeconds / 31536000);
			result = years + " سال پیش";
		}
		return result;
	}
	function updateStackMessageTimes()
	{
		function deepSearch (obj)
		{
			if (!obj)
				return;
			if (typeof obj === 'object') {
				let o = new Object(obj)
				if (o.hasOwnProperty('create_date_g')) {
					let message = $('.e-chat-list-wrap').find('li[data-id="'+o.id+'"]');
					if (message.length) {
						//console.log("try to change date : " , o)
						let newTimeDate = convertDateStringToReadableTime(o.create_date_g);
						message.find('.js-create-date-time').html(newTimeDate);
					}
				}
			}
			if (Array.isArray (obj)) {
				for (let item of obj) {
					deepSearch (item);
				}
			}
		}
		deepSearch(chatStack);
	}
	function searchInMessagesByDisplay ()
	{
		let hiddenMessages = [];
		function deepSearch (obj)
		{
			if (!obj)
				return;
			if (typeof obj === 'object') {
				let o = new Object(obj)
				if (o.hasOwnProperty('display') && o.display === false) {
					hiddenMessages.push(obj.id);
				}
			}
			if (Array.isArray (obj)) {
				for (let item of obj) {
					deepSearch (item);
				}
			}
		}
		deepSearch(chatStack);
		return hiddenMessages;
	}
	function updateStackMessageDisplayById (id , status)
	{
		let updateList = [];
		function deepSearch (obj)
		{
			if (!obj)
				return;
			if (typeof obj === 'object') {
				let o = new Object(obj)
				if (o.hasOwnProperty('display') && o.display === false) {
					if (o.id == id) {
						return true;
					}
				}
			}
			if (Array.isArray (obj)) {
				for (let item of obj) {
					deepSearch (item);
				}
			}
		}
		deepSearch(chatStack);
		return updateList;
	}
	function stackSearchById(array, key)
	{
		let value = false;

		function deepSearch (obj)
		{
			if (!obj)
				return false;
			if (typeof obj === 'object') {
				let o = new Object(obj)
				if (o.hasOwnProperty('display') && o.id == key) {
					value = true;
					return true;
				}
			}
			if (Array.isArray (obj)) {
				for (let item of obj) {
					deepSearch(item);
				}
			}
		}
		deepSearch(chatStack);
		return value;
	}
	function renderChatStack(object , stack , scrollType , chatScrollPosition = 10 , type = 'update')
	{

		if (object.group !== undefined)
			load_chat_data(object.group)
		if (object.allow_chat !== undefined ) {
			if (object.group !== undefined && object.group.chat.group_allow_chat == 0) {
				if (arsin_current_user_is_admin == true) {

					if (! $('.chat-history-footer .allow-chat-alert').hasClass('d-none')) {
						$('.chat-history-footer').toggleClass('chat-footer-mp');
						$('.chat-history-footer > form').toggleClass('d-none');
						$('.chat-history-footer > form').toggleClass('d-flex');
						$('.chat-history-footer .allow-chat-alert').addClass('d-none');
					}
				} else {
					if ($('.chat-history-footer .allow-chat-alert').hasClass('d-none')) {
						$('.chat-history-footer').toggleClass('chat-footer-mp');
						$('.chat-history-footer > form').toggleClass('d-flex');
						$('.chat-history-footer > form').toggleClass('d-none');
						$('.chat-history-footer .allow-chat-alert').removeClass('d-none');
					}
				}
			} else {
				if (object.allow_chat == 0 ) {
					if ( $('.chat-history-footer .allow-chat-alert').hasClass('d-none')) {
						$('.chat-history-footer .allow-chat-alert').removeClass('d-none');
					}
					if (! $('.chat-history-footer').hasClass('chat-footer-mp')) {
						$('.chat-history-footer').addClass('chat-footer-mp');
					}
					if (! $('.chat-history-footer > form').hasClass('d-none')) {
						$('.chat-history-footer > form').addClass('d-none');
						$('.chat-history-footer > form').removeClass('d-flex');
					}
				} else {
					if (! $('.chat-history-footer .allow-chat-alert').hasClass('d-none')) {
						$('.chat-history-footer .allow-chat-alert').addClass('d-none');
					}
					if ($('.chat-history-footer').hasClass('chat-footer-mp')) {
						$('.chat-history-footer').removeClass('chat-footer-mp');
					}
					if ($('.chat-history-footer > form').hasClass('d-none')) {
						$('.chat-history-footer > form').removeClass('d-none');
						$('.chat-history-footer > form').addClass('d-flex');
					}
				}
			}
		}

		let message_meta = '';

		stack.forEach(chat => {
			let messageInStack = false;
			if (chatStack.length > 0 ) {

				messageInStack = stackSearchById(chatStack , chat.id);
			}
			if (messageInStack !== false) {
				return;
			} else {
				let chatItem = [];
				chatItem[chat.id] = chat;
				if (scrollType == 'down') {
					chatStack.push(chatItem);
				}
				if (scrollType == 'up') {
					chatStack.unshift(chatItem);
				}
			}
		});
		let displayStack = [];
		if (scrollType == 'up') {
			if (chatStack.length < 10) {
				displayStack = chatStack;
				displayStack.reverse();
			} else {
				displayStack =   stackPaginate(chatStack , currentPageNumber , true);
			}

			if (displayStack == false ) {
				return ;
			}
		} else {
			if (chatStack.length < 10) {
				displayStack = chatStack;
				displayStack.reverse();
			} else {
				displayStack = stackPaginate(chatStack , 1 );
			}
			if (displayStack == false) {
				return ;
			}
			displayStack.reverse();
		}
		displayStack.forEach((c , i) => {
			if (! Array.isArray(c)) {
				return;
			}
			if (c.length === 0 ) {
				return;
			}
			let chatObjects = new Object(c.slice(1));
			let chat =  chatObjects.filter(x => typeof x!== undefined).shift()
			if (chat === undefined) {
				return ;
			}
			let displayMessageClass = chat.display === true ? true : false;
			let displayMessageClassOutput = true; //chat.user_id == arsin_current_user_id  || displayMessageClass;
			if ($('body').find('li[data-id="'+chat.id+'"]').length !== 0) {
				displayMessageClassOutput = false;
			}
			if (displayMessageClassOutput === true) {
				let message_meta= '';
				let message_display_css = '';
				if (displayMessageClass == false && chat.user_id != arsin_current_user_id) {
					message_display_css = ' d-none ';
				}
				if (chat.user_id == arsin_current_user_id) {
					if (chat.status == 1 || chat.status == 3) {
						message_meta = '<div><span class="badge badge-center bg-label-danger"><i class="bx bx-message-alt-minus"></i> تائید نشده</span></div>';
					}
				}
				let sendername = chat.sender_name === undefined ? '' : chat.sender_name;
				console.log("sender : " , chat.sender_name , sendername)
				let userdisplayname = '<label style="background: rgba(75, 162, 254, 0.8);padding: 3px 8px;font-size: 10px;position: absolute;top: 4px;right: 4px;">'+sendername+'</label>';
				if (chat.user_id == arsin_current_user_id) {
					var chat_box = '<li  data-id="' + chat.id + '"  class="chat-message chat-message-right"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+ userdisplayname +'<p class="mb-0">' + chat.message + '</p></div><div class="text-end text-muted mt-1"><i class="bx bx-check-double text-success"></i><small  class="js-create-date-time">' + chat.create_date + '</small>' + message_meta + '</div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
				} else {
					var chat_box = '<li data-id="' + chat.id + '"  class="chat-message '+message_display_css+'"><div class="d-flex overflow-hidden"><div class="user-avatar flex-shrink-0 me-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+ userdisplayname +'<p class="mb-0">' + chat.message + '</p></div><div class="text-muted mt-1"><small  class="js-create-date-time">' + chat.create_date + '</small></div></div></div></li>';
				}

				if (chat.has_file == 1) {
					chat_box = WH_RenderFileHtml(chat , message_display_css);
				}
				if (scrollType == 'up') {
					if ($('.e-chat-list-wrap').find('li').length === 0) {
						$('.e-chat-list-wrap').html(chat_box);
					} else {
						$('.e-chat-list-wrap').find('li:first-child').before(chat_box);
					}
				}
				if (scrollType == 'down') {
					if ($('.e-chat-list-wrap').find('li').length === 0) {
						$('.e-chat-list-wrap').html(chat_box);
					} else {
						$('.e-chat-list-wrap').find('li:last-child').after(chat_box);
					}
				}
			}
		});
	}
	function getLastStackId()
	{
		let sl = chatStack.slice(-1);
		if (typeof sl === NaN || typeof sl === undefined || typeof sl === null) {
			console.log("last stack id is " , sl)
			return false;
		}
		let message_object = {};
		for (let c of sl.valueOf()) {
			if (! Array.isArray(c)) {
				return false;
			}
			let o = new Object(c.slice(1));
			message_object =  o.filter(x => typeof x!== undefined).shift()
		}
		if (message_object.id !== undefined) {
			return message_object.id;
		}
		return false;
	}
	function getFirstStackId()
	{
		let sl = chatStack.slice(0 , 1);
		if (typeof sl === NaN || typeof sl === undefined || typeof sl === null) {
			return false;
		}
		let message_object = {};
		for (let c of sl.valueOf()) {
			let o = new Object(c.slice(1));
			message_object =  o.filter(x => typeof x!== undefined).shift()
		}
		if (message_object.id !== undefined) {
			return message_object.id;
		}
		return false;
	}
	function reverseCustomArray (array)
	{
		let reversed_array = [];
		for (let i = array.length - 1; i >= 0; i--) {
			reversed_array.push (array[i]);
		}
		return reversed_array;
	}
	function stackPaginate (array, page_number , reverse)
	{
		if (page_number > Math.round(chatStack.length / 10)) {
			return false;
		}
		let page_size = 10;
		let reversedArray1 = [];
		let reversedArray = [];
		reversedArray1 =reverseCustomArray(array) ;
		let start_index = (page_number - 1) * page_size;
		let end_index = page_number * page_size;
		reversedArray =	reversedArray1.slice(start_index, end_index);
		if (reverse == true) {
			reversedArray = (reversedArray);
		}
		console.log( "page num"+page_number,"start index : "+start_index , "end index : " + end_index , reversedArray)
		return reversedArray;
	}
	function scrollChatHistory()
	{
		let message_meta = '';
		let displayStack = [];
		let displayReversedStack = [];
		displayReversedStack = chatStack;
		if (currentPageNumber < Math.round(chatStack.length / 10))
			currentPageNumber++;
		displayStack = stackPaginate(displayReversedStack , currentPageNumber , true );
		if (displayStack === false) {
			return false;
		}

		displayStack.forEach((c , i) => {
			let chatObjects = new Object(c.slice(1));
			let chat =  chatObjects.filter(x => typeof x!== undefined).shift()
			if (chat === undefined) {
				return false;
			}
			let displayMessageClass = chat.display === true ? true : false;
			let displayMessageClassOutput = chat.user_id == arsin_current_user_id  || displayMessageClass;

			if (displayMessageClassOutput === true) {
				let message_meta= '';
				if (chat.user_id == arsin_current_user_id) {
					if (chat.status == 1 || chat.status == 3) {
						message_meta = '<div><span class="badge badge-center bg-label-danger"><i class="bx bx-message-alt-minus"></i> تائید نشده</span></div>';
					}
				}
				let sendername = chat.sender_name === undefined ? '' : chat.sender_name;
				let userdisplayname = `<label style="background: rgba(75, 162, 254, 0.8);padding: 3px 8px;font-size: 10px;/*! border-radius: 15px; */position: absolute;top: 4px;right: 4px;">`+sendername+`</label>`;
				if (chat.user_id == arsin_current_user_id) {
					var chat_box = '<li  data-id="' + chat.id + '"  class="chat-message chat-message-right"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+ userdisplayname +'<p class="mb-0">' + chat.message + '</p></div><div class="text-end text-muted mt-1"><i class="bx bx-check-double text-success"></i><small  class="js-create-date-time">' + chat.create_date + '</small>' + message_meta + '</div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
				} else {
					var chat_box = '<li data-id="' + chat.id + '"  class="chat-message "><div class="d-flex overflow-hidden"><div class="user-avatar flex-shrink-0 me-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+ userdisplayname +'<p class="mb-0">' + chat.message + '</p></div><div class="text-muted mt-1"><small  class="js-create-date-time">' + chat.create_date + '</small></div></div></div></li>';
				}

				if (chat.has_file == 1) {
					chat_box = WH_RenderFileHtml(chat , 1);
				}

				if ($('.e-chat-list-wrap').find('li').length === 0) {
					$('.e-chat-list-wrap').html(chat_box);
				} else {
					$('.e-chat-list-wrap').find('li:first-child').before(chat_box);
				}
			}
		});
	}

	function load_chat_data(r)
	{
		$('.selected-chat-title').find('h6').html(r.chat.group_name);
		$('.selected-chat-title').find('small').html(r.chat.group_note);
		$('.selected-chat-title').closest('.chat-history-header').find('small.update-chat-time').html(r.chat.group_last_update);
	}
	$('#chat-list').on('click' , 'li' , function() {
		chatStack = [];
		currentPageNumber =  1;
		$('.e-chat-list-wrap').find('li').remove();
		c_('.app-chat-history').block({
			message:
			'<div class="d-flex justify-content-center"><p class="mb-0">لطفا صبر کنید ...</p> <div class="sk-wave m-0 ms-2"><div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div></div> </div>',

			css: {
				backgroundColor: 'transparent',
				color: '#fff',
				border: '0',
				width: '80%'
			},
			overlayCSS: {
				opacity: 0.3
			}
		});
		chatUpdate('down' , 'scrollToBottom');

		$("#app-chat-contacts").toggleClass('show')
		if ($(".chat-history-footer").length) {
			if ($(".chat-history-footer").hasClass('d-none')) {
				$(".chat-history-footer").removeClass('d-none')
			}
		}

	});

	function isJSON(data)
	{
		var IS_JSON = !0;
		try {
			var json = $.parseJSON(data)
		} catch (err) {
			IS_JSON = !1
		}
		return IS_JSON
	}

	chatHistoryBody.addEventListener('ps-y-reach-start', () => {

		scrollChatHistory();
		if (Math.round(chatStack.length / 10) <= currentPageNumber) {
			currentPageNumber = Math.round(chatStack.length / 10);
			c_('.app-chat-history').block({
				message:
				'<div class="d-flex justify-content-center"><p class="mb-0">لطفا صبر کنید ...</p> <div class="sk-wave m-0 ms-2"><div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div> <div class="sk-rect sk-wave-rect"></div></div> </div>',

				css: {
					backgroundColor: 'transparent',
					color: '#fff',
					border: '0',
					width: '80%'
				},
				overlayCSS: {
					opacity: 0.3
				}
			});

			fetchStack();
		}

	});
	chatHistoryBody.addEventListener('ps-scroll-up', (e) => {

	});
	chatHistoryBody.addEventListener('ps-scroll-down', (e) => {

	});

	let chatHistoryHeaderMenu = document.querySelector(".chat-history-header [data-target='#app-chat-contacts']");
	//chatSidebarLeftClose = document.querySelector('.app-chat-sidebar-left .close-sidebar');
	chatHistoryHeaderMenu.addEventListener('click', e => {
		$("#app-chat-contacts").toggleClass('show');
	});
	$('.add-file-to-chat').change(function(e) {
		e.preventDefault();
		let fl_files = e.target.files;
		let fileTemp =`<div class="d-flex">
			<a href="javascript:void(0)" class="d-flex align-items-center me-3">
			<img src="${arsin_chat_online_assets}img/icons/misc/file.png" alt="file" width="75" class="me-2">
			<h6 style="color:#fff;" class="mb-0">${fl_files[0].name}</h6>
			</a>
			</div>`;
		let wraper = Math.floor(Math.random() * (1000 - 50)) + 50;
		var chat_box = '<li class="chat-message chat-message-right"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text"><p class="mb-0"> ' + fileTemp + ' </p></div><div class="text-end text-muted mt-1"><i class="bx bx-upload text-success"></i> <small>در حال بارگذاری... </small><span id="progress'+wraper+'">0</span></div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
		if ($('.e-chat-list-wrap').find('li').length > 0) {
			$('.e-chat-list-wrap').find('li:last-child').after(chat_box);
		} else {
			$('.e-chat-list-wrap').append(chat_box);
		}
		let chat_id = $('#chat-list').find('li.active').attr('data-id');
		arsinUploadFile(chat_id , wraper);
	})
	function arsinUploadFile(chat_id , wraper)
	{
		let fileInput = document.getElementById("attach-doc");
		let file = fileInput.files[0];
		let formData = new FormData();
		formData.append("file", file);
		formData.append("chat_id", chat_id);
		formData.append("action", 'arsin_chat_online_send_file');
		let xhr = new XMLHttpRequest();
		xhr.upload.addEventListener("progress", function (event) {
			if (event.lengthComputable) {
				let percent = Math.round((event.loaded / event.total) * 100);
				if ($("#progress"+wraper).length > 0) {
					$("#progress"+wraper).html( percent + "%");
				}
			}
		});
		xhr.open("POST", chat_online_ajax_url);
		xhr.send(formData);
		xhr.onload = function() {
			try {
				let res = JSON.parse(xhr.responseText);
				if (res.error == false) {
					let r = res.type;
					if (res.file_id === undefined || res.file_id == '')
						return false;
					var chat_id = $('#chat-list').find('li.active').attr('data-id');

					var data = {
						action: 'arsin_chat_online_send_message',
						message: res.file_name,
						file: 1,
						file_id: res.file_id,
						chat_id: chat_id
					};

					$.ajax({
						type: 'post',
						url : chat_online_ajax_url,
						data: data,
						dataType: 'json',
						success :	function(r) {
							if (r.data.status === true) {
								let chatItem= [];
								chatItem[r.data.id] = {
									id: `${r.data.id}`,
									chat_id :chat_id,
									message : res.file_name,
									create_date : r.data.time,
									create_date_g : r.data.create_date_g,
									file_id : res.file_id,
									file_type : res.type,
									file_url : res.file_url,
									has_file : 1,
									status : r.data.message_status,
									update_date : r.data.time,
									user_id : arsin_current_user_id,
									sender_name : res.sender_name,
									display : true
								};
								chatStack.push(chatItem);
								WH_RenderFilePreview(res , wraper);
							}

						},
						beforeSend:	function() {

						},
						error:	function() {

						}
					}).done(function(r) {

					});
				}
				if (res.error == true && res.error_type !== undefined) {
					let pr = $("#progress"+wraper).closest('li').find('.d-flex');
					switch (res.error_type) {
						case 'file_data':
							pr.html("این فایل برای آپلود مجاز نیست لطفا فایل صحیح انتخاب کنید");
							break;
						case 'file_ex':
							pr.html("<p class='alert alert-warning'>این نوع فایل را نمی توانید بارگذاری کنید</p>")
							break;
						case 'file_size':

							pr.html("<p class='alert alert-warning'>فایل انتخابی شما بیش از اندازه بزرگ است</p>")

							break;
						case 'file_control':
							pr.html("<p class='alert alert-warning'>این نوع فایل را نمی توانید بارگذاری کنید</p>")
							break;

						default:
							pr.html("خطا در بارگذاری فایل.");
							break;
					}
				}
			} catch (e) {
				if ($("#progress"+wraper).length > 0) {
					$("#progress"+wraper).closest('li').find('.d-flex').html("خطا در بارگذاری فایل.");
				}
			}
		};
		xhr.onerror = function() {

		};
		xhr.onabort = function() {

		};
		xhr.ontimeout = function() {

		};
	}
	function WH_RenderFilePreview(fileDtat , Wrap )
	{
		let uploadWrapper = $("#progress"+Wrap).closest('li');

		setTimeout(function() {
			let previewInner = '';
			switch (fileDtat.type) {
				case 'image':
					previewInner = '<img style="max-width: 120px;border: 2px solid #fff;border-radius: 8px;" src="'+fileDtat.file_url+'" />';
					break;
				case 'audio':
					previewInner = `<audio controls=""  muted="" id="chat-aoudio-ring"  style="display: block;">
					<source src="${fileDtat.file_url}" type="${fileDtat.file_mime}"/>
						</audio>`;
					break;
				case 'video':
					previewInner = `<video width="320" height="240" controls>
									<source src="${fileDtat.file_url}" type="${fileDtat.file_mime}">
								Your browser does not support the video tag.
								</video> `;
					break;

				default:
					previewInner = fileDtat.file_name;
					break;
			}
			var dlBtn = '<a type="button" href="'+fileDtat.file_url+'" target="_blank" class="btn rounded-pill btn-outline-vimeo"><i class="tf-icons bx bxl-download me-1"></i> دانلود فایل</a>';
			let sendername = fileDtat.sender_name == undefined ? '' : fileDtat.sender_name;
			let userdisplayname = `<label style="background: rgba(75, 162, 254, 0.8);padding: 3px 8px;font-size: 10px;/*! border-radius: 15px; */position: absolute;top: 4px;right: 4px;">`+sendername+`</label>`;

			var filePreview = '<li class="chat-message chat-message-right"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+userdisplayname+'<p class="mb-0">'+previewInner+'</p></div><div class="text-end text-muted mt-1"><i class="bx bx-download text-success"></i> <small class="js-create-date-time">   </small> '+ dlBtn +' </div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
			uploadWrapper.after(filePreview);
			uploadWrapper.remove();

		},1000);
	}
	function WH_RenderFileHtml(fileDtat , view = '')
	{


		let previewInner = '';
		switch (fileDtat.file_type) {
			case 'image':
				previewInner = '<img style="max-width: 120px;border: 2px solid #fff;border-radius: 8px;" src="'+fileDtat.file_url+'" />';
				break;
			case 'audio':
				previewInner = `<audio controls=""  muted="" id="chat-aoudio-ring"  style="display: block;">
					<source src="${fileDtat.file_url}" type="${fileDtat.file_mime}"/>
						</audio>`;
				break;
			case 'video':
				previewInner = `<video width="320" height="240" controls>
									<source src="${fileDtat.file_url}" type="${fileDtat.file_mime}">
								Your browser does not support the video tag.
								</video> `;
				break;

			default:
				previewInner = fileDtat.message;
				break;
		}
		var dlBtn = '<a type="button" href="'+fileDtat.file_url+'" target="_blank" class="btn rounded-pill btn-outline-vimeo"><i class="tf-icons bx bxl-download me-1"></i> دانلود فایل</a>';

		let sendername = fileDtat.sender_name == undefined ? '' : fileDtat.sender_name;
		let userdisplayname = `<label style="background: rgba(75, 162, 254, 0.8);padding: 3px 8px;font-size: 10px;/*! border-radius: 15px; */position: absolute;top: 4px;right: 4px;">`+sendername+`</label>`;
		var filePreview = '<li data-id="'+fileDtat.id+'" class="chat-message chat-message-right '+view+'"><div class="d-flex overflow-hidden"><div class="chat-message-wrapper flex-grow-1"><div class="chat-message-text">'+userdisplayname+'<p class="mb-0">'+previewInner+'</p></div><div class="text-end text-muted mt-1"><i class="bx bx-download text-success"></i> <small class="js-create-date-time"> '+ fileDtat.create_date +'   </small> '+ dlBtn +' </div></div><div class="user-avatar flex-shrink-0 ms-3"><div class="avatar avatar-sm"><i class="bx bx-message-alt-dots" style="font-size: 32px;color: #a2a2a2;"></i></div></div></div></li>';
		return filePreview;
	}
});
