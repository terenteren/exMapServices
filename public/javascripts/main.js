var mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10
};

var map = new naver.maps.Map('map', mapOptions);

// DB 조회
$.ajax({
    url: "location",
    type: "GET"
}).done((response) => {
    if (response.message !== "success") return;
    const data = response.data;
        
    let markerList = [];        // 마커를 담을 배열
    let infowindowList = [];    // 마커 정보를 담을 배열

    // function getClickHandler(i) { return function() {} }
    const getClickHandler = (i) => () => {
        const marker = markerList[i];
        const infowindow = infowindowList[i];
        if (infowindow.getMap()) { // infowindow가 지도위에 표시가 되어 있는지 확인
            infowindow.close();
        } else {
            infowindow.open(map, marker); // 지도의 마커에 infowindow 표시
        }
    }

    const getClickMap = (i) => () => {
        const infowindow = infowindowList[i];
        infowindow.close();
    }


    for (let i in data) {
        const target = data[i];
        const latlng = new naver.maps.LatLng(target.lat, target.lng); // API에서 사용될 좌표값 설정
        
        // 지도위에 좌표의 마커 표시
        let marker = new naver.maps.Marker({
            map: map,
            position: latlng,
            icon: {
                content: `<div class="marker"></div>`,
                anchor: new naver.maps.Point(7.5, 7.5), // 마커 크기의 절반 값으로 중심 설정
            },
        });

        // 마커 정보 설정
        const content = `
            <div class="infowindow_wrap">
                <div class="infowindow_title">${target.title}</div>
                <div class="infowindow_address">${target.address}</div>
            </div>
        `;

        // 마커 정보 표시 상자 설정
        const infowindow = new naver.maps.InfoWindow({
            content : content,
            backgroundColor: "#00ff0000",
            borderColor: "#00ff0000",
            anchorSize: new naver.maps.Size(0, 0), // 마커 말풍선 표시 안함
        });

        markerList.push(marker);
        infowindowList.push(infowindow);
    }

    for (let i = 0, ii = markerList.length; i < ii; i++) {
        // 지도에 마커를 클릭시
        naver.maps.Event.addListener(markerList[i], "click", getClickHandler(i));
        // 지도를 클릭시
        naver.maps.Event.addListener(map, "click", getClickMap(i));
    }

    // 마커 클러스터의 크기 3개 설정 (10개 = cluster1, 10~100개 = cluster2, 100개이상 cluster3 사용)
    const cluster1 = {
        content: `<div class="cluster1"></div>`,
    };

    const cluster2 = {
        content: `<div class="cluster2"></div>`,
    };

    const cluster3 = {
        content: `<div class="cluster3"></div>`,
    };

    // 밀집 되어 있는 마커를 모아서 보여주는 클러스터 설정
    const markerClustering = new MarkerClustering({
        minClusterSize : 2,
        maxZoom: 12,
        map : map,
        markers : markerList,
        disableClickZoom : false,   // 마커를 클릭시 줌이 되는 기능 false로 해야 작동
        gridSize: 100,   // 사이즈 값이 작으면 클러스터의 영역이 세분화 되도록 만들 수 있음 (평균 100)
        icons: [cluster1, cluster2, cluster3],
        indexGernerator: [2, 5, 10],    // 마커의 수가 2~4개 이하일때 cluster1 실행, 5~9개 이하일때 cluster2, 10개 이상일때 cluster3로 설정
        stylingFunction: (clusterMarker, count) => { // 클러스터 안에 몇개의 마커가 있는지 표현
            $(clusterMarker.getElement()).find("div:first-child").text(count);
        }
    });
});


// 도별 정보를 받아올 서버
const urlPrefix = "https://navermaps.github.io/maps.js/docs/data/region";
const urlSuffix = ".json";

let regionGeoJson = [];
let loadCount = 0;

const tooltip = $(
    `<div style="position:absolute; z-index:1000; padding:5px 10px; background: white; border:1px solid black; font-size: 14px; display: none; pointer-events:none;"></div>`
);

tooltip.appendTo(map.getPanes().floatPane); // tootip을 지도안에 삽입

// 17개 도를 구역 별로 나누고 이벤트를 추가
naver.maps.Event.once(map, "init_stylemap", () => {
    for (let i = 1; i<18; i++) {
        let keyword = i.toString();
        if(keyword.length === 1) { // 키워드 값이 한자리수 일때 앞에 0을 붙임
            keyword = "0" + keyword;
        }
        $.ajax({
            url : urlPrefix + keyword + urlSuffix,
        }).done((geojson) => {
            regionGeoJson.push(geojson);
            loadCount++;
            if (loadCount === 17) { // 17개 도 정보가 가득 차면 아래 함수 실행
                startDataLayer();
            }
        });
    }
});

// 구 표시 css 설정
function startDataLayer() {
    map.data.setStyle(feature => {
        const styleOptions = {
            fillColor : "#ff0000",
            fillOpacity : 0.0001,
            strokeColor: "#ff0000",
            strokeWeight: 2,
            strokeOpacity: 0.4,
        };

        if(feature.getProperty("focus")) {
            styleOptions.fillOpacity = 0.6;
            styleOptions.fillColor = "#0f0";
            styleOptions.strokeColor = "#0f0";
            styleOptions.strokeWeight = 4;
            styleOptions.strokeOpacity = 1;
        }

        return styleOptions;
    });

    regionGeoJson.forEach((geojson) => {
        map.data.addGeoJson(geojson);   // addGeoJson 함수가 결과값을 바탕으로 도별 구획을 나눔
    });

    // 지도의 도 클릭시 표현
    map.data.addListener("click", (e) => {
        let feature = e.feature;
        if(feature.getProperty("focus") !== true) {
            feature.setProperty("focus", true);
        } else {
            feature.setProperty("focus", false);
        }
    });

    // 지도의 도에 마우스 오버시 표현
    map.data.addListener("mouseover", (e) => {
        let feature = e.feature;
        let regionName = feature.getProperty("area1"); // 도의 이름
        tooltip
            .css({
                display: "block",
                left : e.offset.x,
                top: e.offset.y
            })
            .text(regionName); // 
        map.data.overrideStyle(feature, {
            fillOpacity: 0.6,
            strokeWeight: 4,
            strokeOpacity: 1,
        });
    });
    // 지도의 도에 마우스 아웃 될때 표현
    map.data.addListener("mouseout", (e) => {
        tooltip.hide().empty();
        map.data.revertStyle();
    })
}