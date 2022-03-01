const mapContainer = document.getElementById("map");
const mapOption = {
    center : new daum.maps.LatLng(37.554477, 126.970419), // 서울역
    level: 3,   // 확대 크기
};

let map = new daum.maps.Map(mapContainer, mapOption);

let infowindow = new daum.maps.InfoWindow({
    zIndex: 1,  // 지도 보다 위에 마커 정보 표시
});

let markerList = [];

let ps = new daum.maps.services.Places();

searchPlaces();

// 키워드를 받고 검색하는 함수
function searchPlaces() {
    let keyword = $("#keyword").val();
    ps.keywordSearch(keyword, placesSearchCB); // 결과값을 placesSearchCB에 콜백
}

function placesSearchCB(data, status) {
    if (status === daum.maps.services.Status.OK) {
        displacePlaces(data);
    } else if (daum.maps.services.Status.ZERO_RESULT) {
        alert("검색 결과가 존재하지 않습니다");
        return
    } else if (status === daum.maps.services.ERROR) {
        alert("검색 결과중 오류가 발생했습니다");
        return
    }
}

// 검색 결과값 리스트로 생성
function displacePlaces(data) {
    let listEl = document.getElementById("placesList");

    // LatLngBounds()
    // 지도에서 검색 했을때 검색된 지점으로 이동 하면서 영역을 보여주는 기능
    // 마커들에 대한 영역들을 계산을 해서 범위를 보여줄 수 있음
    let bounds = new daum.maps.LatLngBounds();  

    // 검색결과 초기화
    removeAllChildNodes(listEl);
    removeMarker();

    // 반복문을 통해서 bounds에 마커를 넣어 줌
    for (let i = 0; i < data.length; i++) {
        let lat = data[i].y;
        let lng = data[i].x;
        let address_name = data[i]["address_name"];
        let place_name = data[i]["place_name"];

        const placePosition = new daum.maps.LatLng(lat, lng);
        bounds.extend(placePosition);

        // 카카오 지도에 마커 생성
        let marker = new daum.maps.Marker({ 
            position: placePosition,
        });
        marker.setMap(map);
        markerList.push(marker);

        // 결과값(주소 결과)을 리스트 형태로 생성
        const el = document.createElement("div");
        const itemStr = `
            <div class="info">
                <div class="info_title">
                    ${place_name}
                </div>
                <span>${address_name}</span>
            </div>
        `;

        el.innerHTML = itemStr;
        el.className = "item";
        
        // 마커, 지도, 결과값 클릭시 infowindow가 열기 닫기가 되도록 설정
        daum.maps.event.addListener(marker, "click", function() {
            displayInfowindow(marker, place_name, address_name, lat, lng);
        });

        daum.maps.event.addListener(map, "click", function () {
            infowindow.close();
        });

        el.onclick = function () {
            displayInfowindow(marker, place_name, address_name, lat, lng);
        }

        listEl.appendChild(el); // 생성한 검색 리스트 적용
    }
    map.setBounds(bounds);
}

function displayInfowindow(marker, title, address, lat, lng) {
    let content = `
        <div style="padding: 25px;">
            ${title}<br>
            ${address}<br>
            <button onclick="onSubmit('${title}', '${address}', ${lat}, ${lng});">등록</button>
        </div>
    `;
    map.panTo(marker.getPosition()); // 지도로 이동
    infowindow.setContent(content);
    infowindow.open(map, marker); // 지도에 마커 정보 표시
}

function removeAllChildNodes(el) {
    while(el.hasChildNodes()) { // el 태그 안에 태그가 있다면 true
        el.removeChild(el.lastChild);
    }
}

function removeMarker() {
    for (let i = 0; i < markerList.length; i++) {
        markerList[i].setMap(null); // 이전 마커들을 지워줌
    }
    markerList = []; // 마커 리스트 초기화
}

function onSubmit(title, address, lat, lng) {
    $.ajax({
        url : "/location",
        data : {title, address, lat, lng},
        type : "POST",
    }).done((response) => {
        console.log("데이터 요청 성공");
        alert("성공");
    }).fail(error => {
        console.log("데이터 요청 실패");
        alert("실패");
    });
}