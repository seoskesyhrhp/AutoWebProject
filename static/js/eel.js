/*
* **注意：**

在使用以上方法时，要确保已经将文档中的所有元素加载完毕，否则可能会无法找到需要添加类名的元素。可以使用以下方法来等待文档加载完毕后再执行  js  代码：

window.addEventListener('load', function() {
  // 执行添加 className 的代码
});
* */
var loginBtn = document.getElementById("login-btn");
var overlay = document.querySelector(".overlay");
var closeBtn = overlay.querySelector(".close-btn");
let l_quit = document.getElementById('l_quit');
let m_copy = document.getElementById('currentSong');
var menu = document.getElementById('r_menu');
let seek = document.getElementById('seek-bar');

setInterval(function () {
    seek.style.width = '100%';
    document.onclick = function (e) {
        menu.className = 'vpopmenu vhidden';
    };
    bindMenu();
}, 800);
let audio = null;
audio = document.querySelector('audio');
const progressBar = document.getElementById('play-bar');
audio.addEventListener('timeupdate', updateProgressBar);

function updateProgressBar() {
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    const progressBarWidth = (currentTime / duration) * 100;
    progressBar.style.width = progressBarWidth + '%';
}

setInterval(function () {
    let online = navigator.onLine;
    if (online == false) {
        layer.msg('网络连接异常,已启用自动连接', {
            icon: 5, time: 2000 //2秒关闭（如果不配置，默认是3秒）
        }, function () {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/ajax/online/', true);
            xhr.send();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let res = JSON.parse(xhr.responseText);
                    if (res.code === 200) {
                        layer.msg('网络连接正常', {icon: 6, time: 1000});
                        // window.location.reload();
                    } else {
                        layer.msg('网络连接异常,请检查网络', {icon: 5, time: 1000});
                    }
                } else {
                    layer.msg('网络连接异常,请检查网络', {icon: 5, time: 1000});
                }
            };
        });
    }
}, 60000);
bindMenu();
document.onclick = function (e) {
    menu.className = 'vpopmenu vhidden';
};

function bindMenu() {
    var $BIPanal = $('div[class="jp_img pic_po"]').contextmenu(function (e) {
        let oEvent = e || event;
        e.preventDefault();
        menu.className = "vpopmenu";
        menu.style.left = (oEvent.clientX) / 2 + 70 + 'px';
        menu.style.top = oEvent.clientY + 'px';
        return false;
    });
}

setInterval(function () {
    bindMenu();
    updateProgressBar();
}, 3000);

function updateMenu() {
    let song_name = document.getElementById('currentSong').innerText;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/ajax/updateSongImg/?song_name=' + song_name, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let res = JSON.parse(xhr.responseText);
            if (res.code === 200) {
                layer.msg(res.msg, {icon: 1, time: 1500});
                menu.className = 'vpopmenu vhidden';
            } else {
                layer.msg(res.msg, {icon: 2, time: 1500});
                menu.className = 'vpopmenu vhidden';
            }
        } else {
            layer.msg('请求失败', {icon: 2, time: 1500});
            menu.className = 'vpopmenu vhidden';
        }
    }
}

function l_copy() {
    let text = m_copy.innerText;
    const input = document.createElement('input');
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('value', text);
    document.body.appendChild(input);
    input.select();
    // input.setSelectionRange(0, input.value.length);
    if (document.execCommand('copy')) {
        document.execCommand('copy');
        layer.msg('复制成功', {icon: 1, time: 1500});
    } else {
        layer.msg('复制失败', {icon: 2, time: 1500});
    }
    document.body.removeChild(input);
}

m_copy.addEventListener('click', function (e) {
    e.preventDefault();
    let text = m_copy.innerText;
    const input = document.createElement('input');
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('value', text);
    document.body.appendChild(input);
    input.select();
    // input.setSelectionRange(0, input.value.length);
    if (document.execCommand('copy')) {
        document.execCommand('copy');
        layer.msg('复制成功', {icon: 1, time: 1500});
    } else {
        layer.msg('复制失败', {icon: 2, time: 1500});
    }
    document.body.removeChild(input);
});

l_quit.addEventListener('click', function (e) {
    if (overlay.className === 'overlay open') {
        // overlay.remove(".open");
        overlay.classList.value = 'overlay';
        //刷新
        //window.location.reload();
    }
})

loginBtn.addEventListener("click", function () {
    overlay.classList.add("open");
});

closeBtn.addEventListener("click", function () {
    overlay.classList.remove("open");
    //刷新
    window.location.reload();
});
playback();

function playback() {
    var icp = document.getElementById('icon_btn');
    var player = document.getElementById('jp_audio_0');
    // console.log(icp.className)
    if (player.src !== null && player.src !== undefined) {
        icp.className = 'btn prev iconp'
        document.getElementById("i_pic").className = 'i_pic_po';
        player.autoplay = true;
        player.play();
    }
};

function downloadFile(url, name) {
    var a = document.createElement('a');
    a.setAttribute('download', name);
    a.setAttribute('target', '_blank');
    a.setAttribute('href', url);
    a.click();
}
