(() => {
    const companyEmail = 'testfortestjs@gmail.com';
    const itsproEmail = 'info@itspro.by';

    const localStorageBookingListKey = 'bookingList';

    const weekdayCost = 10;
    const weekendCost = 30;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let calendarMonth = currentMonth;
    let calendarYear = currentYear;

    let selectedCheckinDate = null;
    let selectedCheckoutDate = null;
    
    let totalCost;

    let selectedTd;    
 
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];    

    const dateOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    };
    
    let isSelectedDatesValid = true;

    function getElement(id) {
        return document.getElementById(id);
    }

    function createElement(tag) {
        return document.createElement(tag);
    }

    function removeClass(element, cssClasses) {
        element.classList.remove(...cssClasses);
    }

    function addClass(element, cssClasses) {
        element.classList.add(...cssClasses);
    }

    function getInputValue(id) {                    
        return getElement(id).value.trim();
    }
 
    function daysInMonth (month, year) {
        return 32 - new Date(year, month, 32).getDate();
    }

    function next() {
        getElement('previous').setAttribute('style', 'display: block;');

        calendarYear = (calendarMonth === 11) ? calendarYear + 1 : calendarYear;
        calendarMonth = (calendarMonth + 1) % 12;

        createTbody(calendarMonth, calendarYear);
    }
    
    function previous() {  
        calendarYear = (calendarMonth === 0) ? calendarYear - 1 : calendarYear;
        calendarMonth = (calendarMonth === 0) ? 11 : calendarMonth - 1;

        if (currentMonth === calendarMonth && currentYear === calendarYear) {
            getElement('previous').setAttribute('style', 'display: none;');
        }

        createTbody(calendarMonth, calendarYear);
    }

    function getWeekDayOfFirstMonthDay (year, month) {
        return new Date(year, month).getDay() === 0 ? 7 : new Date(year, month).getDay();
    }

    function createEmptyTd(day) {
        const td = createElement('td');        
        td.textContent = day;            
        return td;
    }

    function createTd(day, cost) {
        const td = createEmptyTd(day);       

        if (cost) {            
            const span = createElement('span');
            span.textContent = `${cost} р.`;            
            addClass(span, ['badge', 'badge-pill', 'badge-info', 'align-bottom']);
            span.setAttribute('style', 'display:block;');

            td.append(span);
        }    
                
        return td;
    }

    function createBookedTd(day, clientName) {
        const td = createEmptyTd(day);     
        disableCalendarCell(td);
       
        const p = createElement('p');
        p.textContent = clientName;   
        addClass(p, ['text-nowrap']);
        p.setAttribute('style', 'display:block; width: 3rem;  overflow: hidden;');

        td.append(p);

        return td;
    }

    function getCost(weekDayNumber) {       
        return weekDayNumber < 6 ? weekdayCost : weekendCost;        
    }

    function createTbody(month, year) {
        let dateClientNameMap = getBookingDateClientNameMap();

        const tbody = getElement('calendar-body');
        tbody.innerHTML = "";    

        const selectMounthAndYear = getElement('monthAndYear');
        selectMounthAndYear.innerHTML = `${months[month]} ${year}`;

        let monthDayCounter = 1;
        let nextMonthDayCounter = 1;  

        const weekDaysNumber = 7;
        const weeksNumber = 6; 

        let prevMonthLastDay = daysInMonth((month === 0) ? 11 : month - 1, year);

        const weekDayOfFirstMonthDay = getWeekDayOfFirstMonthDay(year, month);
             
        for (let i = 0; i < weeksNumber; i++) { 
            const tr = createElement('tr');                             

            for (let j = 1; j <= weekDaysNumber; j++) {
                if (i === 0 && j < weekDayOfFirstMonthDay) {                    
                    const prevMonthDay = createTd(prevMonthLastDay - weekDayOfFirstMonthDay + 1 + j, null);
                    disableCalendarCell(prevMonthDay);

                    tr.append(prevMonthDay);                  
                } 
                else if (monthDayCounter > daysInMonth(month, year)) {
                    const nextMonthDay = createTd(nextMonthDayCounter, null);
                    disableCalendarCell(nextMonthDay);

                    tr.append(nextMonthDay);
                    nextMonthDayCounter++;               
                }
                else {
                    const checkoutDateRadio = getElement('checkoutDateRadio'); 
                    const needDisable = needDisableTd(monthDayCounter, month, year, checkoutDateRadio);
                    let td;

                    if (needDisable) {
                        td = createEmptyTd(monthDayCounter)
                        disableCalendarCell(td);
                    }
                    else {                        
                        const date = new Date(year, month, monthDayCounter);

                        if (dateClientNameMap.length !== 0 && dateClientNameMap[date.toString()]) {
                            let name = dateClientNameMap[date.toString()];
                            td = createBookedTd(monthDayCounter, name);
                        }
                        else {
                            const cost = getCost(j);
                            td = createTd(monthDayCounter, cost);
                            td.dataset.object = createSelectedDateJson(date, cost);  
                        }                         
                    }

                    tr.append(td);
                    monthDayCounter++;
                }
            } 

            tbody.append(tr);           
        }
    
        return tbody;
    }

    function needDisableTd(day, month, year, checkoutDateRadio) {
        let isPastDays = day < currentDate.getDate() && month === currentMonth && year === currentYear;
        let isDaysBeforeSelectedDate = checkoutDateRadio.checked && selectedCheckinDate && month === selectedCheckinDate.getMonth() && year === selectedCheckinDate.getFullYear() && day <= selectedCheckinDate.getDate();
        let isNotValidCheckoutDates = checkoutDateRadio.checked && selectedCheckinDate && (month < selectedCheckinDate.getMonth() || year < selectedCheckinDate.getFullYear());

        return isPastDays || isDaysBeforeSelectedDate || isNotValidCheckoutDates;
    }

    function getBookingDateClientNameMap() {
        const bookingList = getBookingListFromLocalStorage();

        let dateNameMap = {};
        let monthLastDate = new Date(calendarYear, calendarMonth + 1, 0);

        for (let el of bookingList) {
            let name = el.clientName;

            let endDate = new Date(el.selectedCheckoutDate) <= monthLastDate ? new Date(el.selectedCheckoutDate) : monthLastDate;
            let datesBetween = getDatesBetween(new Date(el.selectedCheckinDate), endDate);

            datesBetween.forEach(function(date) {
                dateNameMap[date] = name;
            });
        }

        return dateNameMap;
    }
    
    function getDatesBetween(startDate, endDate) {
        let dates = [];
        let current = startDate;
        const dayMilliseconds = 1000 * 60 * 60 * 24;

        while (current <= endDate) {
            dates.push(new Date (current));
            current = new Date(+current + dayMilliseconds);
        }

        return dates;
    }

    function disableCalendarCell(calendarCell) {
        calendarCell.setAttribute('style', 'pointer-events: none;');
        addClass(calendarCell, ['table-secondary', 'text-white']);
    }

    function createSelectedDateJson(date, cost) {
        return JSON.stringify({date, cost,});
    }

    function getSelectedDateObject(td) {
        const jsonString = td.getAttribute("data-object");
        return JSON.parse(jsonString);
    }

    function setSelectedDate(day, month, year, elementId) {     
        const element = getElement(elementId);

        addClass(element, ['border-success']);
        element.innerHTML = `${months[month]} ${day}, ${year}`;              
    }

    function calculateTotalCost() {
        if (selectedCheckinDate && selectedCheckoutDate) {
            let start = selectedCheckinDate;
            const finish = selectedCheckoutDate;
            const dayMilliseconds = 1000 * 60 * 60 * 24;
            let totalCost = 0;

            while (start < finish) {
                let day = selectedCheckinDate.getDay();
                totalCost += day === 0 || day === 6 ? weekendCost : weekdayCost;
                start = new Date(+start + dayMilliseconds);
            }
            
            return totalCost;
        }
        else {
            return null;
        }
    }   
                      
    function createBookingCalendar(container) {
        createTbody(calendarMonth, calendarYear);

        getElement('next').addEventListener('click', next);
        getElement('previous').addEventListener('click', previous);
        
        const checkinDateRadio = getElement('checkinDateRadio'); 
        const checkoutDateRadio = getElement('checkoutDateRadio');
        const totalCostElement = getElement('totalCost');
        
        addClass(totalCostElement, ['text-danger']);    

        totalCostElement.innerHTML = 'для расчета выберите даты.';

        checkoutDateRadio.addEventListener('click', function() {
            createTbody(calendarMonth, calendarYear);
        });
        
        checkinDateRadio.addEventListener('click', function() {
            onCheckinRadioSelected(totalCostElement);
        }); 

        container.addEventListener('click', function(event) {
            onDateSelected(container, event, checkinDateRadio, checkoutDateRadio, totalCostElement);
        }); 
        
        const form = getElement('bookingForm');
        form.addEventListener('submit', onFormSubmit);        
    }

    function onCheckinRadioSelected(totalCostElement) {  
        selectedCheckinDate = null;      
        selectedCheckoutDate = null;
        
        getElement('checkoutDate').innerHTML = '';        

        removeClass(totalCostElement, ['text-success']);
        addClass(totalCostElement, ['text-danger']); 
        totalCostElement.innerHTML = 'для расчета выберите даты';

        createTbody(calendarMonth, calendarYear);
    }

    function onDateSelected(container, event, checkinDateRadio, checkoutDateRadio, totalCostElement) {
        let td = event.target.closest('td');
        if (!td) return;
        if (!container.contains(td)) return;

        if (selectedTd) {
            removeClass(selectedTd, ['bg-success', 'text-white']);
        }          
                 
        selectedTd = td;
        addClass(selectedTd, ['bg-success', 'text-white']);
    
        const date = new Date(getSelectedDateObject(td).date);
        let elementId = checkinDateRadio.checked ? 'checkinDate' : 'checkoutDate';
            
        if (checkinDateRadio.checked) {
            selectedCheckinDate = date;
        }
        else {
            selectedCheckoutDate = date;
        }

        setSelectedDate(date.getDate(), calendarMonth, calendarYear, elementId);

        if (checkoutDateRadio.checked && selectedCheckoutDate) {
            getElement('dateNotSelectedMessage').textContent = '';

            if (hasBookedDatesBetweenSelected()) {
                selectedCheckinDate = null;
                isSelectedDatesValid = false;
                getElement('dateNotSelectedMessage').textContent = 'выбраны неверные даты';
            }
        }

        totalCost = calculateTotalCost();
           
        if (totalCost) {
            removeClass(totalCostElement, ['text-danger']);
            addClass(totalCostElement,['text-success']);

            totalCostElement.textContent = `${totalCost} рублей.`;
        }
    }

    function hasBookedDatesBetweenSelected() {
        const bookingList = getBookingListFromLocalStorage();
        let dateNameMap = {};

        for (let el of bookingList) {
            let name = el.clientName;
            let datesBetween = getDatesBetween(new Date(el.selectedCheckinDate), new Date(el.selectedCheckoutDate));

            datesBetween.forEach(function(date) {
                dateNameMap[date] = name;
            });
        }
    
        let start = selectedCheckinDate;
        const finish = selectedCheckoutDate;
        const dayMilliseconds = 1000 * 60 * 60 * 24;

        while (start < finish) {

            if (dateNameMap[start.toString()]) {
                return true;
            }

            start = new Date(+start + dayMilliseconds);
        }

        return false;
    }

    function createBookingObject(clientName, emailAdress, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost) {
        return {clientName, emailAdress, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost,};
    }

    function onFormSubmit(e) {
        e.preventDefault();

        const clientName = getInputValue('clientName');
        const emailAdress = getInputValue('emailAdress');
        const bookingTime = getInputValue('bookingTime');
       
        const dateNotSelectedMessage = getElement('dateNotSelectedMessage');

        if (selectedCheckinDate && selectedCheckoutDate && isSelectedDatesValid) {
            dateNotSelectedMessage.textContent = '';

            const bookingObject = createBookingObject(clientName, emailAdress, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost);
            updateBookingListInLocalStorage(bookingObject);

            let emailBody = createEmailBody(clientName, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost);
            sendMail(emailBody, emailAdress);

            let selfEmailBody = createSelfEmailBody(clientName, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost);
            sendMail(selfEmailBody, itsproEmail);

            selectedCheckinDate = null;
            selectedCheckoutDate = null;
            getElement('checkinDate').innerHTML = '';
            getElement('checkoutDate').innerHTML = '';

            createTbody(calendarMonth, calendarYear);
        }
        else {            
            dateNotSelectedMessage.textContent = 'выберите обе даты в календаре';
        }
    } 

    function getBookingListFromLocalStorage() {
        let json = localStorage.getItem(localStorageBookingListKey);

        if (json) {
            return JSON.parse(json);
        }
         else {
            localStorage.setItem(localStorageBookingListKey, JSON.stringify([]));
            return JSON.parse(localStorage.getItem(localStorageBookingListKey));
        }
    }

    function updateBookingListInLocalStorage(addedBookingObject) {
        let bookingList = getBookingListFromLocalStorage();

        if (!bookingList) {
            bookingList = [];
        }

        bookingList.push(addedBookingObject);
        localStorage.setItem(localStorageBookingListKey, JSON.stringify(bookingList));
    }    
    
    function createEmailBody(clientName, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost) {
        let div = document.createElement('div');

        let title =  document.createElement('h3');
        title.textContent = `Добрый день, ${clientName}!`;

        div.appendChild(title);

        let dates = document.createElement('p');
        dates.textContent = `Вы забронировали номер с ${selectedCheckinDate.toLocaleString("ru", dateOptions)} до ${selectedCheckoutDate.toLocaleString("ru", dateOptions)}.`;
        insertAfter(title, dates);

        let time = document.createElement('p');
        time.textContent = `Время заселения и выселения: ${bookingTime}.`;
        insertAfter(dates, time);

        let cost = document.createElement('p');
        time.textContent = `Стоимость бронирования: ${totalCost} рублей.`;
        insertAfter(time, cost);

        let signature = document.createElement('p');
        signature.textContent = `С уважением, наша компания.`;
        insertAfter(cost, signature);

        return div.innerHTML;
    }

    function createSelfEmailBody(clientName, bookingTime, selectedCheckinDate, selectedCheckoutDate, totalCost) {
        let div = document.createElement('div');

        let title =  document.createElement('h3');
        title.textContent = `${clientName} произвел бронирование.`;

        div.appendChild(title);

        let dates = document.createElement('p');
        dates.textContent = `Даты бронирования с ${selectedCheckinDate.toLocaleString("ru", dateOptions)} до ${selectedCheckoutDate.toLocaleString("ru", dateOptions)}.`;
        insertAfter(title, dates);

        let time = document.createElement('p');
        time.textContent = `Время заселения и выселения: ${bookingTime}.`;
        insertAfter(dates, time);

        let cost = document.createElement('p');
        time.textContent = `Стоимость бронирования: ${totalCost} рублей.`;
        insertAfter(time, cost);
        
        return div.innerHTML;
    }

    function insertAfter(referenceNode, newNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function sendMail(emailBody, recipientEmail) {
        Email.send({
            Host : "smtp.elasticemail.com",
            Username : "testfortestjs@gmail.com",
            Password : "693BD1EE301B6BB51DCB134AADE6075F6964",
            To : recipientEmail,
            From : companyEmail,
            Subject : "Подтверждение бронирования",
            Body : emailBody
        }).then( 
            alert('сообщение отправлено успешно, попадает в СПАМ.')
        );
        
    }
    window.createBookingCalendar = createBookingCalendar;
})();