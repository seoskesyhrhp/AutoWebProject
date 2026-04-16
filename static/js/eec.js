window.loaded = function () {
    playback();

}
let img = document.getElementById("i_pic");
let icon = document.getElementById('icon_btn');
let link = document.getElementsByTagName('a');
let play = document.getElementsByClassName('jp-play')[0];
let cl_tr = document.getElementsByClassName('lryic_info');

Array.from(link).forEach(function (item) {
    item.addEventListener('click', function () {
        $("#rsp").click(function () {
            document.getElementById("i_pic").className = 'i_pic_po';
            console.log(document.getElementById("i_pic").className)
        });
        $("#stp").click(function () {
            document.getElementById("i_pic").className = 'i_pic_stop';
            console.log(document.getElementById("i_pic").className)
        });
        if (play.style.display === 'inline-block') {
            icon.className = 'btn prev iconp';
        } else {
            icon.className = 'btn prev iconfont';
            document.getElementById("i_pic").className = 'i_pic_stop';
        }
    })
});

function player(id) {
    console.log(id)
    var player = document.getElementById('aplay');
    player._href.search('name');
}

setTimeout(function () {
    //img.onclick();
    icon.onclick();
}, 3000);

function playback() {
    let j_play=document.getElementById("jquery_jplayer_1");
    var icp=document.getElementById('icon_btn');
    var player = document.getElementById('jp_audio_0');
    //player.src=j_play.dataset.url;
    document.querySelector('audio').volume=0;
    if (player.src !== null && player.src !== undefined){
        icp.className='btn prev iconp'
        document.getElementById("i_pic").className='i_pic_po';
        player.autoplay = true;
        player.play();
        document.querySelector('audio').volume=0.8;
    }
};
/**
 * 返回指定区间[min, max]内的随机整数
 * @param {number} min - 最小值（包括在区间内）
 * @param {number} max - 最大值（包括在区间内）
 * @returns {number} 返回随机整数
 */
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random_play() {
    // 随机int
    $.ajax({
        type: 'GET',
        url: '/ajax/count',
        datatype: 'json',
        success: function (data) {
            id = data['id']
            const randomNum = randomInteger(1, id); // 产生1-10之间的随机整数
            //console.log(randomNum); // 输出随机整数
            window.location.href = '/play/' + randomNum + '.html';
            // var player = document.getElementById('jp_audio_0');
            // player.play();
        },
        error: function (data) {
            alert('服务器出错了,error')
        }
    })

}

function SongLryic() {
    // alert('歌词')
    layer.msg('开始加载', {offset: '85px', icon: 1, time: 1000})
    var song_name = document.getElementById('currentSong').innerText;
    // await clear_tr();
    //document.getElementById('j-contain').className='contain';
    $.ajax({
        type: 'GET',
        url: '/search/song_lryic/',
        data: {'song_name': song_name},
        datatype: 'json',

        success: function (data) {
            //console.log(data)
            if (data) {
                inform = confirm("是否获取歌词？")
                if (inform === true) {
                    var lryic = data['data']
                    var id = 0;
                    for (var i = 0; i < lryic.length; i++) {
                        id += 1;
                        var tsk = $(`<tr id="" class="lryic_info" onmouseover="on(this)" onmouseout="out(this)">`
                            + `<td id="" class="lryt" onclick="tdshow()">${id}</td>`
                            + `<td id="" class="lryn" onclick="tdshow()">${lryic[i][0]}</td>`
                            + `<td id="" class="lryd" onclick="tdshow()">${lryic[i][1]}</td>`
                            + `</tr>`)
                        $('#login-form').append(tsk)
                    }
                } else {
                    window.event.returnValue = false;
                }
            } else {
                alert('暂无歌词')
            }
            // document.querySelector(".overlay").classList.add('open');
            document.querySelector(".overlay").classList.value = 'overlay open';
//分页
            var table = document.getElementById("login-form");
            var rowsPerPage = 11; //每页显示的行数
            var currentPage = 1; //当前页码

            function showRows(page) {
                var startIndex = (page - 1) * rowsPerPage;
                var endIndex = startIndex + rowsPerPage;
                var rows = table.getElementsByTagName("tr");
                for (var i = 1; i < rows.length; i++) { //第一行为表头，不显示
                    rows[i].style.display = (i >= startIndex && i < endIndex) ? "" : "none"; //显示或隐藏行
                }
            }

            function createPagination(totalPages) {
                var pagination = document.getElementById("pagination");
                pagination.innerHTML = "";
                var first = document.createElement("span");
                first.className = "first-page";
                first.innerHTML = "首页";
                first.style.marginRight = "10px";
                // first.style.color = "blue";
                first.onclick = function () {
                    currentPage = 1;
                    showRows(currentPage);
                    createPagination(totalPages);
                };
                pagination.appendChild(first);
                var prev = document.createElement("span");
                prev.innerHTML = "上一页";
                prev.onclick = function () {
                    if (currentPage > 1) {
                        currentPage--;
                        showRows(currentPage);
                        createPagination(totalPages);
                    }
                };
                pagination.appendChild(prev);
                for (var i = 1; i <= totalPages; i++) {
                    var page = document.createElement("span");
                    page.innerHTML = i;
                    page.onclick = (function (i) {
                        return function () {
                            currentPage = i;
                            showRows(currentPage);
                            createPagination(totalPages);
                        };
                    })(i);
                    if (i == currentPage) {
                        page.className = "current-page";
                        // page.style.color = "#ddd"       //"red"; //当前页码标红
                        // page.style.background= '#15c142 url() 0 0 no-repeat';
                    }
                    pagination.appendChild(page);
                }
                var next = document.createElement("span");
                next.innerHTML = "下一页";
                next.onclick = function () {
                    if (currentPage < totalPages) {
                        currentPage++;
                        showRows(currentPage);
                        createPagination(totalPages);
                    }
                };
                pagination.appendChild(next);
                var last = document.createElement("span");
                last.innerHTML = "尾页";
                last.onclick = function () {
                    currentPage = totalPages;
                    showRows(currentPage);
                    createPagination(totalPages);
                };
                pagination.appendChild(last);
            }

            var rows = table.getElementsByTagName("tr");
            var totalPages = Math.ceil((rows.length - 1) / rowsPerPage); //总页数
            // alert(totalPages)
            showRows(currentPage); //显示第一页数据
            createPagination(totalPages); //创建分页控件
        },
        xhrFields: {
            onprogress: function (e) {
                // console.log(e.loaded,e.total);
                if (e.lengthComputable) {
                    //go(e.loaded,e.total)
                    var percent = e.loaded / e.total * 100;
                    console.log(percent)
                    document.querySelector(".overlay").classList.value = 'overlay open';
                }
            }
        },
        error: function (data) {
            alert('服务器出错了,error')
        }
    })
    //document.querySelector(".overlay").classList.add('open')
}

function go(start, end) {
    const circleLeft = document.querySelector('.left-circle')
    const circleRight = document.querySelector('.right-circle')
    const number = document.querySelector('.number')

    function formatDegreeLeft(percent) {
        // 封装左边圆角度
        return `rotate(${-225 + (360 / 100 * percent)}deg)`  // 旋转角度要与定时器相对应，我这使用的是6s转动360度
    }

    function formatDegreeRight(percent) {
        // 封装右边圆角度
        return `rotate(${-45 + (360 / 100 * percent)}deg)`
    }

    function setRotateLeft(node, percent) {
        // 设置旋转左圆的角度
        node.style.transform = formatDegreeLeft(percent)
    }

    function setRotateRight(node, percent) {
        // 设置旋转右圆的角度
        node.style.transform = formatDegreeRight(percent)
    }

    let percent = start  //百分比
    let t = setInterval(() => {
        percent++
        if (percent >= 0 && percent <= 50) { //如果百分比在50以内旋转右边圆
            setRotateRight(circleRight, percent)
        } else if (percent > 50 && percent <= 100) { //如果百分比在50以上，固定右半边圆和旋转左半边圆
            circleRight.style.transform = 'rotate(135deg)'
            setRotateLeft(circleLeft, percent)
        }
        number.textContent = percent + '%'
        if (percent >= end) {
            clearInterval(t)
            if (percent >= 100) {
                number.textContent = '加载完成'
            }
        }
    }, 60)
}

function SongInfo(data) {
    for (var i = 0; i < data.length; i++) {
        console.log(data[i][0], data[i][1])

        var tsk = $(`<tr>`
            + `<span class="num">${i}</span>`
            + `<td><span class="n1">${data[i][0]}</span></td>`
            + `<td><span class="pic">${data[i][1]}</span></td>`
            + `</tr>`)
        console.log(tsk)
        $('#login-form').append(tsk)
        // document.getElementById('login-form').append(tsk)
    }
    var loginBtn = document.getElementById("login-btn");
    var overlay = document.querySelector(".overlay");
    var closeBtn = overlay.querySelector(".close-btn");

    loginBtn.addEventListener("click", function () {
        overlay.classList.add("open");
    });

    closeBtn.addEventListener("click", function () {
        overlay.classList.remove("open");
        window.location.reload();
    });
}

function on(obj) {
    obj.style.background = "#30c37e";
    obj.className = "lryic_info show";
    obj.id = "show";
}

function out(obj) {
    obj.style.background = "#fff";
    obj.className = "lryic_info";
    obj.id = "";
}

function tdshow() {
    var lryn = document.getElementById("show").innerText
    lryn = lryn.split('\t')
    var song_name = document.getElementById("currentSong").innerText
    // var song_name=lryn[1]
    var id = lryn[2]
    var eshow = confirm("是否获取所选内容的歌词？" + '\n' + "歌曲名：" + song_name + '\n' + "歌曲id：" + id)
    if (eshow === true) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/ajax/getlryic?song_name=' + song_name + '&id=' + id, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                if (data['msg'] === 'success') {
                    // alert('获取成功')
                    layer.msg('获取成功', {
                        offset: '85px',
                        icon: 1,
                        time: 1500
                    });
                } else {
                    alert('获取失败' + '\n' + data['msg'])
                }
            }
        }
    } else {
        window.event.returnValue = false;
    }
}

function showhidden() {
    var loginBtn = document.getElementById("login-btn");
    var overlay = document.querySelector(".overlay");
    var closeBtn = overlay.querySelector(".close-btn");

    loginBtn.addEventListener("click", function () {
        overlay.classList.add("open");
    });

    closeBtn.addEventListener("click", function () {
        overlay.classList.remove("open");
        window.location.reload();
    });


}


