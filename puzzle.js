(function (global) {
        var lastTime = 0,
                vendors = ['ms', 'moz', 'webkit', 'o'];
        
        for (var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x) {
                global.requestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'];
                global.cancelAnimationFrame = global[vendors[x]+'CancelAnimationFrame'] || global[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!global.cancelAnimationFrame) {
                global.cancelAnimationFrame = function (id) {
                        clearTimeout(id);
                };
        }
}(this));

 jQuery(document).ready(function($){

        $('.flexslider').flexslider({
            animation: "slide",
            minItems: 4,
            move: 1,
            itemWidth: 200,
            itemMargin: 5,
            slideshow: false,
            controlNav: false,
            touch: true
        });

        $(window).on('load', function(){
            $('body').addClass('otros-closed');
            var otros = $('.otros');
            var otros_alto = otros.height();
            otros.css( 'bottom', -otros_alto-10+'px' );
        });

        $('#change').on( 'click touchend', function(e){
            e.preventDefault();

            var otros = $('.otros');

            if( $('body').hasClass('otros-closed') ){
                $('body').removeClass('otros-closed').addClass('otros-open');
                otros.css( 'bottom', 0 );
            }else{
                $('body').removeClass('otros-open').addClass('otros-closed');
                var otros_alto = otros.height();
                otros.css( 'bottom', -otros_alto-10+'px' );
            }
        });

        const PUZZLE_DIFFICULTY_WIDTH = 4;
        const PUZZLE_DIFFICULTY_HEIGHT = 3;
        const PUZZLE_HOVER_TINT = '#009900';

        var _stage;
        var _canvas;

        var _img;
        var _pieces;
        var _puzzleWidth;
        var _puzzleHeight;
        var _pieceWidth;
        var _pieceHeight;
        var _currentPiece;
        var _currentDropPiece;  

        var _mouse;

        var eventsMap  = {
                select: "click",
                down: "mousedown",
                up: "mouseup",
                move: "mousemove"
            };
        var touchSupported = false;

        function init( img ){
            if( img == undefined ){
                img= "img/1.jpg";
            }
            _img = new Image();
            _img.addEventListener('load',onImage,false);
            _img.src = img ;
        }
        function onImage(e){
            _pieceWidth = Math.floor(_img.width / PUZZLE_DIFFICULTY_WIDTH)
            _pieceHeight = Math.floor(_img.height / PUZZLE_DIFFICULTY_HEIGHT)
            _puzzleWidth = _pieceWidth * PUZZLE_DIFFICULTY_WIDTH;
            _puzzleHeight = _pieceHeight * PUZZLE_DIFFICULTY_HEIGHT;
            setCanvas();
            initPuzzle();
        }
        function setCanvas(){
            _canvas = $('#canvas');
            _stage = _canvas[0].getContext('2d');
            _canvas[0].width = _puzzleWidth;
            _canvas[0].height = _puzzleHeight;
        }
        function initPuzzle(){
            _pieces = [];
            _mouse = {x:0,y:0};
            _currentPiece = null;
            _currentDropPiece = null;
            _stage.drawImage(_img, 0, 0, _puzzleWidth, _puzzleHeight, 0, 0, _puzzleWidth, _puzzleHeight);
            $('body').removeClass('loading');
            buildPieces();
        }
        function buildPieces(){
            var i;
            var piece;
            var xPos = 0;
            var yPos = 0;
            for(i = 0;i < PUZZLE_DIFFICULTY_WIDTH * PUZZLE_DIFFICULTY_HEIGHT;i++){
                piece = {};
                piece.sx = xPos;
                piece.sy = yPos;
                _pieces.push(piece);
                xPos += _pieceWidth;
                if(xPos >= _puzzleWidth){
                    xPos = 0;
                    yPos += _pieceHeight;
                }
            }

            $('#play .ir').on('click touchend', function(e){
                e.preventDefault();
                if( Modernizr.touch && Modernizr.mq('(min-width: 950px) and (orientation: landscape)')){
                    goFullScreen();
                }
                
                $('#play').fadeOut( 888 , function(){
                    shufflePuzzle();
                });
            });
        }
        function shufflePuzzle(){
            _pieces = shuffleArray(_pieces);
            _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
            var i;
            var piece;
            var xPos = 0;
            var yPos = 0;
            for(i = 0;i < _pieces.length;i++){
                piece = _pieces[i];
                piece.xPos = xPos;
                piece.yPos = yPos;
                _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, xPos, yPos, _pieceWidth, _pieceHeight);
                _stage.strokeRect(xPos, yPos, _pieceWidth,_pieceHeight);
                xPos += _pieceWidth;
                if(xPos >= _puzzleWidth){
                    xPos = 0;
                    yPos += _pieceHeight;
                }
            }
            if( !touchSupported ){
                $('#canvas').on('mousedown', onPuzzleClick);
            }else{
                $('#canvas').on('touchstart',function( e ){
                     var e = e.originalEvent;
                     e.preventDefault();
                     onPuzzleClick( e ); 
                });
            }
        }
        function onPuzzleClick(e){

            if( !Modernizr.touch ){
                _mouse.x = e.pageX - _canvas.offset().left;
                _mouse.y = e.pageY - _canvas.offset().top;
            }else{
                _mouse.x = e.touches[0].pageX - _canvas.offset().left;
                _mouse.y = e.touches[0].pageY - _canvas.offset().top;
            }
            
            _currentPiece = checkPieceClicked();
            if(_currentPiece != null){
                _stage.clearRect(_currentPiece.xPos,_currentPiece.yPos,_pieceWidth,_pieceHeight);
                _stage.save();
                _stage.globalAlpha = .9;
                _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
                _stage.restore();

                if( !touchSupported ){
                    document.onmousemove = updatePuzzle;
                    document.onmouseup = pieceDropped;
                }else{
                    $('#canvas').bind( 'touchmove', function(e){
                        var e = e.originalEvent;
                        updatePuzzle(e);
                    });
                    
                    $('#canvas').bind( 'touchend', function(ev){
                        var e = ev.originalEvent;
                        pieceDropped(e);
                    });
                }
            }
        }
        
        function checkPieceClicked(){
            var i;
            var piece;
            for(i = 0;i < _pieces.length;i++){
                piece = _pieces[i];
                if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                }
                else{
                    return piece;
                }
            }
            return null;
        }
        
        function updatePuzzle(e){

            e.preventDefault();
            e.stopPropagation();

            _currentDropPiece = null;

            if( !Modernizr.touch ){
                _mouse.x = e.pageX - _canvas.offset().left;
                _mouse.y = e.pageY - _canvas.offset().top;
            }else{
                _mouse.x = e.touches[0].pageX - _canvas.offset().left;
                _mouse.y = e.touches[0].pageY - _canvas.offset().top;
            }
            
            _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);
            var i;
            var piece;
            for(i = 0;i < _pieces.length;i++){
                piece = _pieces[i];
                if(piece == _currentPiece){
                    continue;
                }
                _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
                _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
                if(_currentDropPiece == null){
                    if(_mouse.x < piece.xPos || _mouse.x > (piece.xPos + _pieceWidth) || _mouse.y < piece.yPos || _mouse.y > (piece.yPos + _pieceHeight)){
                    }
                    else{
                        _currentDropPiece = piece;
                        _stage.save();
                        _stage.globalAlpha = .4;
                        _stage.fillStyle = PUZZLE_HOVER_TINT;
                        _stage.fillRect(_currentDropPiece.xPos,_currentDropPiece.yPos,_pieceWidth, _pieceHeight);
                        _stage.restore();
                    }
                }
            }
            _stage.save();
            _stage.globalAlpha = .6;
            _stage.drawImage(_img, _currentPiece.sx, _currentPiece.sy, _pieceWidth, _pieceHeight, _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth, _pieceHeight);
            _stage.restore();
            _stage.strokeRect( _mouse.x - (_pieceWidth / 2), _mouse.y - (_pieceHeight / 2), _pieceWidth,_pieceHeight);
        }
        function pieceDropped(e){
            if( !touchSupported ){
                document.onmousemove = null;
                document.onmouseup = null;
            }else{
                $('#canvas').unbind( 'touchend' ); 
            }

            if(_currentDropPiece != null){
                var tmp = {xPos:_currentPiece.xPos,yPos:_currentPiece.yPos};
                _currentPiece.xPos = _currentDropPiece.xPos;
                _currentPiece.yPos = _currentDropPiece.yPos;
                _currentDropPiece.xPos = tmp.xPos;
                _currentDropPiece.yPos = tmp.yPos;
            }
            resetPuzzleAndCheckWin();
        }
        function resetPuzzleAndCheckWin(){
            _stage.clearRect(0,0,_puzzleWidth,_puzzleHeight);

            var gameWin = true;
            var i;
            var piece;
            for(i = 0;i < _pieces.length;i++){
                piece = _pieces[i];
                _stage.drawImage(_img, piece.sx, piece.sy, _pieceWidth, _pieceHeight, piece.xPos, piece.yPos, _pieceWidth, _pieceHeight);
                _stage.strokeRect(piece.xPos, piece.yPos, _pieceWidth,_pieceHeight);
                if(piece.xPos != piece.sx || piece.yPos != piece.sy){
                    gameWin = false;
                }
            }
            if(gameWin){
                setTimeout(gameOver,500);
            }
        }
        function gameOver(){
            document.onmousedown = null;
            document.onmousemove = null;
            document.onmouseup = null;
            $('#canvas').unbind();
            initPuzzle();
        }
        function shuffleArray(o){
            for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
            return o;
        }

        $('.otros ul.slides li').on('click', function(e){
            e.preventDefault();
            $('body').addClass('loading');
            gameOver();
            init( $(this).find('img').attr('data-big') );
            $('#change').click();
            $('#play').fadeIn();
        });

        init();
});